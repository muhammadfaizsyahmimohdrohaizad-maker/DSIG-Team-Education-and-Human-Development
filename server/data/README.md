# server/data

Typed queries, one file per table group (D1 to D8 in the data dictionary). Rules:

- Use `db()` for everything a user does. It carries the user's JWT, so RLS decides what comes back.
- Use `adminDb()` only in `/api/export`, account deletion and cron routes, and scope every query to one user id.
- Adviser access to student data goes through the `open_request` RPC, which writes the audit row in the same transaction.
- Return plain objects in the shapes in `lib/types.ts`; never pass raw Supabase errors to the browser.

To add: `profiles.ts` (D1), `learning.ts` (D4), `interview.ts` (D5), `bookings.ts` (D6), `adviser.ts` (D7, D8), `reference.ts` (D3).
