import { useState, useEffect } from "react";
import type { ObservanceSeries } from "../../contracts/observance-series-contract";

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

export function useUpcomingObservances(
  tradition: string,
  days = 30,
  options: { reviewedOnly?: boolean } = {},
) {
  const [observances, setObservances] = useState<UpcomingObservance[]>([]);
  const [series, setSeries] = useState<ObservanceSeries[]>([]);
  const [spiritualDate, setSpiritualDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setObservances([]);
    setSeries([]);
    setSpiritualDate(null);

    const trad = tradition === "all" ? "" : `&tradition=${tradition}`;
    const tz = typeof Intl !== "undefined"
      ? `&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      : "";
    const reviewed = options.reviewedOnly ? "&reviewed=1" : "";
    fetch(`/api/calendar/upcoming?days=${days}${trad}${tz}${reviewed}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (active) {
          setObservances(data.observances ?? []);
          setSeries(data.series ?? []);
          setSpiritualDate(typeof data.from === 'string' ? data.from : null);
          setLoading(false);
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not load calendar");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [tradition, days, options.reviewedOnly]);

  return { observances, series, spiritualDate, loading, error };
}
