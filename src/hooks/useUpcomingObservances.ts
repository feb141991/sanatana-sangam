import { useState, useEffect } from 'react';

export interface UpcomingObservance {
  date: string;
  slug: string;
  display_name: string;
  emoji: string;
  description: string;
  kind: string;
  tradition: string;
  route_kind: string | null;
  route_slug: string | null;
}

export function useUpcomingObservances(tradition: string, days = 30) {
  const [observances, setObservances] = useState<UpcomingObservance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    const trad = tradition === 'all' ? '' : `&tradition=${tradition}`;
    fetch(`/api/calendar/upcoming?days=${days}${trad}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (active) {
          setObservances(data.observances ?? []);
          setLoading(false);
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load calendar');
          setLoading(false);
        }
      });
      
    return () => {
      active = false;
    };
  }, [tradition, days]);

  return { observances, loading, error };
}
