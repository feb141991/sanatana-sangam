ALTER TABLE public.kul_events 
  DROP CONSTRAINT IF EXISTS kul_events_event_type_check;
ALTER TABLE public.kul_events
  ADD CONSTRAINT kul_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'birthday','anniversary','death_anniversary','puja','satsang','custom'
  ]));
