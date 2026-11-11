// SAMPLE DATA for the parent consent page (ParentConsent board). Swap for a lookup of the approval token
// (parent_approvals, hashed, single use, 7-day expiry) once features/onboarding is built.
// The token "expired" shows the expired-link state.

export type ParentRequest =
  | { status: "open"; studentFullName: string; studentFirstName: string; programme: string; adviserVisibility: boolean; expiresOn: string }
  | { status: "expired" };

export function getParentRequestSample(token: string): ParentRequest {
  if (token === "expired") return { status: "expired" };
  return {
    status: "open",
    studentFullName: "Hana Yusof",
    studentFirstName: "Hana",
    programme: "Diploma in Software Engineering, semester 1",
    adviserVisibility: true,
    expiresOn: "Wed 18 Nov 2026",
  };
}
