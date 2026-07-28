-- The only existing UPDATE policy ("Recipient can respond to a pending
-- request") requires status='pending' in its USING clause and
-- auth.uid()=recipient_id -- it can't apply to a rejected row, and it
-- can't apply to the requester. That means sendConnectionRequest's
-- reopen-a-rejected-row path (both the original version and the corrected
-- one that can also flip direction) had no RLS policy actually permitting
-- it for a real signed-in user -- it would have always failed with a
-- permission error / zero rows affected, silently returning success from
-- the client's point of view since the original code never checked how
-- many rows the UPDATE actually touched.
--
-- This policy lets either participant in a *rejected* row turn it back
-- into a pending request, becoming its new requester. The pair of people
-- a row can reference is still bounded by the symmetric unique index
-- (mandali_connections_unique_pair_symmetric) and the no-self-connection
-- check constraint, so this can't be used to create invalid or duplicate
-- rows -- it only ever changes who currently holds the "requester" role.
CREATE POLICY "Either party can reopen a rejected connection as a new request"
  ON public.mandali_connections FOR UPDATE
  TO authenticated
  USING (status = 'rejected' AND (auth.uid() = requester_id OR auth.uid() = recipient_id))
  WITH CHECK (status = 'pending' AND auth.uid() = requester_id);
