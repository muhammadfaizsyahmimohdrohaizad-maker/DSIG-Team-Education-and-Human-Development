# Adviser availability and student booking acceptance tests

## Test setup

Use a preview deployment with the same migrations and auth settings as production. Record deployment ID, Git SHA, applied migration versions, browser, local time and timezone. Use two separate browser profiles with confirmed synthetic accounts. A must have the adviser profile role and current undertaking. B must be an unlocked student. Record the visible account name on each side before testing. Record timestamps in Malaysia time. Use a unique note such as calendar-test-YYYYMMDD-HHMM. Avoid actual appointments. Record only request paths, status, error references and synthetic IDs; omit credentials and cookies.

Choose one initially closed, unblocked weekday slot two to five days from today, in the 14-day student listing window. Record its date, time, duration and adviser ID. Use the same slot throughout. Check each boundary independently; saving a slot, listing it and claiming it are three distinct operations.

## Browser cases

| ID | Action | Expected result and evidence |
|---|---|---|
| A1 | Sign in as A, visit Availability. Record URL and identity. Refresh twice and open Availability in a new tab of A's browser profile. | Every page shows A and the adviser navigation. Record redirect chain if a student page appears. Compare auth user ID with the role on the matching profile row. |
| A2 | Navigate to the test week. Click the chosen Closed cell once. Before saving, check its accessible pressed state and visual label. Click it again. | First click shows Open and pending change; second restores Closed. No database row should be newly committed by either click. |
| A3 | Select the same time again and press Save availability once. Inspect the POST in Network and the inline result. Hard refresh and revisit the same week and session length. | A successful action displays Saved. Cell remains Open. Confirm the row has A's adviser_id, correct slot_start, minutes, is_open=true. HTTP 200 alone does not prove action success. |
| A4 | Navigate one week forward then back; refresh with B still logged in separately. | Saved slot is still open, identity is still A. A navigation failure must not present another week's data as the requested week. |
| B1 | In B's browser profile open Book, select the saved date, find A and the exact time. If Book was already open, refresh. | B sees the same local date, adviser and duration. Compare with open_slots called as B for the same date window. If RPC returns the slot and the UI omits it, investigate the day selector and client state. |
| B2 | Select the time, choose a topic, enter the unique note, select one sharing option, press Send request. Reload My appointments. | Exactly one appointment appears as Requested. Record booking ID. Slot no longer appears as free. Confirm the persisted topic, note and sharing selection. |
| A5 | Open Requests as A; locate B's appointment and inspect the details. Accept it. Reload Requests and My appointments in the respective profiles. | Both accounts show Accepted for the same ID and time. Shared data respects B's selection. Track email separately from booking success. |
| B3 | In a third student session load the slot before B claims it. Submit the stale selection after B succeeds. | Second student receives conflict; only one active booking exists. Repeat B's original request ID against the same slot to check retry idempotency. |
| A6 | Attempt to close an already booked slot, then block a different unused future day and reload. | Booked slot and request survive. Blocked day remains unavailable to B. Unblock the unused day and verify eligible times reappear. |
| B4 | Open Book with past, closed, blocked, and beyond-window slots in the fixture. | None are selectable; an eligible slot inside the window remains selectable. Check the exact UTC timestamp converted to Malaysia time. |
| R1 | Sign out of A's isolated profile and revisit Availability. Then log into that same profile intentionally as B and request the adviser URL. | First request goes to sign-in. Second correctly follows student access rules. Compare with A1 to distinguish a changed account from an incorrect role redirect. |

For cleanup cancel the synthetic appointment through the app and close the test slot. Record cleanup outcome even if an intermediate assertion fails. For a failure capture the first failing case, timestamp, URL before and after refresh, role, slot/booking ID, server-action message and correlated Vercel/Supabase log. Never infer browser success from database checks alone.

## Database execution and results

Run the repository database suite in a disposable Supabase stack with all migrations applied using `supabase test db`. The file `supabase/tests/calendar_handoff.test.sql` creates synthetic users, uses the authenticated role and rolls its transaction back. Eight assertions cover role resolution with stale metadata, calendar reload, student role, open-slot discovery, request persistence, slot removal, adviser request visibility and acceptance seen by the student. The existing booking suite covers conflict, replay, access restrictions, blocked days and booking transitions.

2026-11-14 execution: all eight new assertions and 45 existing assertions passed on isolated PGlite PostgreSQL using the repository Supabase Auth stand-in and pgTAP shim. The local harness ran the existing suite with adviser actions under a stale student role claim. This verifies the migrated SQL path. It does not exercise production PostgREST, Next.js server actions, cookies, hydration, browser refresh or email. Authenticated browser cases A1–R1 are pending. Acceptance requires the same slot and booking ID across A3, B1, B2 and A5 on the target deployment.
