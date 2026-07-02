-- Fix karma_ledger INSERT policy:
-- Original policy used WITH CHECK (true), allowing any authenticated user to insert
-- arbitrary rows via the PostgREST API. The server client uses the anon key (not service
-- role), so that was a real open door. Restrict inserts to own rows only.
-- Also rename the policy to accurately describe what it does.

DROP POLICY IF EXISTS "service_insert_karma_ledger" ON karma_ledger;

CREATE POLICY "users_insert_own_karma_ledger" ON karma_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);
