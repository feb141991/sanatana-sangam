import { useState, useEffect } from "react";
import type { ObservanceSeries } from "../../contracts/observance-series-contract";
import type { HomeObservanceStoryCard } from "../../contracts/observance-story-contract";

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
  options: { reviewedOnly?: boolean; language?: 'en' | 'hi' | 'pa' } = {},
) {
  const [observances, setObservances] = useState<UpcomingObservance[]>([]);
  const [series, setSeries] = useState<ObservanceSeries[]>([]);
  const [storyCards, setStoryCards] = useState<HomeObservanceStoryCard[]>([]);
  const [spiritualDate, setSpiritualDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setObservances([]);
    setSeries([]);
    setStoryCards([]);
    setSpiritualDate(null);

    const trad = tradition === "all" ? "" : `&tradition=${tradition}`;
    const tz = typeof Intl !== "undefined"
      ? `&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      : "";
    const reviewed = options.reviewedOnly ? "&reviewed=1" : "";
    const language = `&lang=${options.language ?? 'en'}`;
    fetch(`/api/calendar/upcoming?days=${days}${trad}${tz}${reviewed}${language}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (active) {
          setObservances(data.displayObservances ?? data.observances ?? []);
          setSeries(data.series ?? []);
          setStoryCards(data.storyCards ?? []);
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
  }, [tradition, days, options.reviewedOnly, options.language]);

  return { observances, series, storyCards, spiritualDate, loading, error };
}
