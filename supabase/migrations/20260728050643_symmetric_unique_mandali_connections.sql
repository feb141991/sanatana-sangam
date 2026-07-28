-- The old constraint only covered the ORDERED pair (requester_id,
-- recipient_id), so A->B and B->A could both exist as separate rows if two
-- users sent each other a connection request in the same window. That let
-- fetchConnectionStatus's .or() lookup match two rows, which a client
-- calling .maybeSingle() reports as an error -- silently swallowed by the
-- caller, permanently breaking status lookups for that pair. Replacing
-- with a symmetric unique index makes the ordered-pair case structurally
-- impossible going forward; confirmed via a live query that zero existing
-- rows currently violate it, so no data migration is needed.
ALTER TABLE public.mandali_connections DROP CONSTRAINT mandali_connections_unique_pair;

CREATE UNIQUE INDEX mandali_connections_unique_pair_symmetric
  ON public.mandali_connections (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));
