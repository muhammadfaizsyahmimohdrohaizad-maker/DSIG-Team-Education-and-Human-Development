"use server";

// onboarding: parent or guardian approval for under-18 accounts (FR-CON-02, System Design 5.3).
import { err, invalid, ok, unexpected, type Result } from "@/lib/result";
import { parentApprovalRequest, parentDecisionInput, parentTokenInput } from "@/lib/schemas";
import {
  claimParentDecision, findParentRequest, insertParentConsent, ownProfile, parentEmailFor, setLocked, undoParentDecision,
} from "@/server/data/account";
import { currentUser } from "@/server/data/supabase";
import { startParentApproval } from "./parent";
import { NOTICE_VERSION, hashToken, maskEmail, parentLinkState, type ParentLinkState } from "./rules";

export type ParentApprovalSent = { sentTo: string; expiresAt: string };

/** The locked student sends (or re-sends) the approval email. A new link replaces any earlier one. */
export async function requestParentApproval(input: unknown = {}): Promise<Result<ParentApprovalSent>> {
  const parsed = parentApprovalRequest.safeParse(input ?? {});
  if (!parsed.success) return invalid(parsed.error);
  const user = await currentUser();
  if (!user) return err("UNAUTHENTICATED", "Log in to send the approval email.");
  const profile = await ownProfile(user.id);
  if (!profile) return err("NOT_FOUND", "We couldn't find your profile. Log out and log in again.");
  if (!profile.isUnder18 || !profile.locked) return err("CONFLICT", "Your account is already open. There's nothing for a parent to approve.");

  const parentEmail = parsed.data.parentEmail ?? (await parentEmailFor(user.id));
  if (!parentEmail) return err("VALIDATION", "Check the highlighted fields.", { parentEmail: "Enter a parent or guardian's email" });
  const started = await startParentApproval(user.id, parentEmail);
  if (!started) return unexpected("requestParentApproval", `not stored user=${user.id}`);
  return ok({ sentTo: maskEmail(parentEmail), expiresAt: started.expiresAt });
}

export type ParentLink =
  | { state: "open"; studentName: string; aiProcessing: boolean; adviserVisibility: boolean; expiresAt: string }
  | { state: Exclude<ParentLinkState, "open"> };

/** For the page the parent opens: what the student chose, or why the link no longer works. No log-in needed. */
export async function checkParentLink(input: unknown): Promise<Result<ParentLink>> {
  const parsed = parentTokenInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const req = await findParentRequest(hashToken(parsed.data.token));
  if (!req) return err("NOT_FOUND", "This link doesn't match a request. Ask the student to send a new one from CareerPrep.");
  const state = parentLinkState({ expires_at: req.expiresAt, decision: req.decision });
  if (state !== "open") return ok({ state });
  return ok({ state, studentName: req.studentName, aiProcessing: req.aiProcessing, adviserVisibility: req.adviserVisibility, expiresAt: req.expiresAt });
}

export type ParentDecision = { decision: "approved" | "declined" };

/** Agree unlocks the account; Decline keeps it locked. Either way one consent row is added with given_by 'parent'. */
export async function recordParentDecision(input: unknown): Promise<Result<ParentDecision>> {
  const parsed = parentDecisionInput.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { token, approve } = parsed.data;
  const hash = hashToken(token);

  const userId = await claimParentDecision(hash, approve);
  if (!userId) {
    const req = await findParentRequest(hash);
    if (!req) return err("NOT_FOUND", "This link doesn't match a request. Ask the student to send a new one from CareerPrep.");
    const state = parentLinkState({ expires_at: req.expiresAt, decision: req.decision });
    if (state === "expired") return err("CONFLICT", "This link has expired. Ask the student to send a new one from CareerPrep; it works for 7 days.");
    return err("CONFLICT", "This request has already been answered. To change the answer, ask the student to send a new link.");
  }

  const stored = (await setLocked(userId, !approve)) && (await insertParentConsent(userId, approve, NOTICE_VERSION));
  if (!stored) {
    await undoParentDecision(hash); // the link stays usable so the parent can try again
    if (approve) await setLocked(userId, true);
    return unexpected("recordParentDecision", `not stored user=${userId}`);
  }
  return ok({ decision: approve ? "approved" : "declined" });
}
