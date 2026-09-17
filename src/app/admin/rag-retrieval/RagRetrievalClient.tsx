"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Layers,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
} from "lucide-react";

export interface RetrievalEvent {
  timestamp: string;
  latency_ms?: number | null;
  provider?: string | null;
  context?: {
    corpus?: string;
    explicit_corpus?: boolean;
    chunks_count?: number;
    top_score?: number | null;
    pending_source?: boolean;
  } | null;
}

interface Props {
  events: RetrievalEvent[];
  gitaReport: string | null;
  upanishadsReport: string | null;
}

const DENSE_CORPORA = new Set(["pathshala_gita", "pathshala_upanishads"]);
const GROUNDING_FLOOR: Record<string, number> = {
  pathshala_gita: 0.3,
  pathshala_upanishads: 0.3,
};
const DEFAULT_SPARSE_FLOOR = 0.04;

function providerLabel(provider: string | null | undefined): { label: string; tone: string } {
  if (provider === "dense-embedding-index") return { label: "Dense", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (provider === "embedding-index") return { label: "Sparse (legacy)", tone: "bg-red-100 text-red-800 border-red-200" };
  return { label: "Manifest lookup", tone: "bg-blue-100 text-blue-800 border-blue-200" };
}

function corpusLabel(corpus: string | undefined): string {
  if (corpus === "pathshala_gita") return "Bhagavad Gita";
  if (corpus === "pathshala_upanishads") return "Upanishads";
  if (!corpus) return "unknown";
  return corpus;
}

export default function RagRetrievalClient({ events, gitaReport, upanishadsReport }: Props) {
  const [corpusFilter, setCorpusFilter] = useState<string>("all");
  const [showGitaReport, setShowGitaReport] = useState(false);
  const [showUpanishadsReport, setShowUpanishadsReport] = useState(false);

  const corpora = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      if (e.context?.corpus) set.add(e.context.corpus);
    }
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (corpusFilter === "all") return events;
    return events.filter((e) => e.context?.corpus === corpusFilter);
  }, [events, corpusFilter]);

  const overall = useMemo(() => {
    const total = filteredEvents.length;
    const withLatency = filteredEvents.filter((e) => typeof e.latency_ms === "number");
    const avgLatency = withLatency.length
      ? Math.round(withLatency.reduce((acc, e) => acc + (e.latency_ms || 0), 0) / withLatency.length)
      : 0;
    const sparseSightings = filteredEvents.filter(
      (e) => e.provider === "embedding-index" && DENSE_CORPORA.has(e.context?.corpus || "")
    ).length;
    const pendingSourceCount = filteredEvents.filter((e) => e.context?.pending_source).length;
    const pendingSourcePct = total ? Math.round((pendingSourceCount / total) * 100) : 0;
    return { total, avgLatency, sparseSightings, pendingSourcePct };
  }, [filteredEvents]);

  const byCorpus = useMemo(() => {
    const map = new Map<
      string,
      { count: number; scoreSum: number; scoreCount: number; belowFloor: number; providers: Record<string, number> }
    >();
    for (const e of events) {
      const corpus = e.context?.corpus || "unknown";
      if (!map.has(corpus)) {
        map.set(corpus, { count: 0, scoreSum: 0, scoreCount: 0, belowFloor: 0, providers: {} });
      }
      const stats = map.get(corpus)!;
      stats.count++;
      const score = e.context?.top_score;
      if (typeof score === "number") {
        stats.scoreSum += score;
        stats.scoreCount++;
        const floor = GROUNDING_FLOOR[corpus] ?? DEFAULT_SPARSE_FLOOR;
        if (score < floor) stats.belowFloor++;
      }
      const providerKey = e.provider || "manifest-lookup";
      stats.providers[providerKey] = (stats.providers[providerKey] || 0) + 1;
    }
    return Array.from(map.entries())
      .map(([corpus, stats]) => ({
        corpus,
        count: stats.count,
        avgScore: stats.scoreCount ? stats.scoreSum / stats.scoreCount : null,
        belowFloorPct: stats.scoreCount ? Math.round((stats.belowFloor / stats.scoreCount) * 100) : 0,
        providers: stats.providers,
      }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-gray-900">RAG Retrieval Quality</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Dense Embeddings Live
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gita &amp; Upanishads pathshala retrieval: live telemetry from the dense-embedding cutover, plus the sparse-vs-dense
            comparison reports and thresholds that justified it.
          </p>
        </div>
      </div>

      {/* Cutover Health Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatTile
          icon={<Layers size={16} className="text-blue-700" />}
          label="Retrievals (window)"
          value={String(overall.total)}
          sub="Last 500 events, most recent first"
        />
        <StatTile
          icon={<Zap size={16} className="text-amber-700" />}
          label="Avg Latency"
          value={`${overall.avgLatency}ms`}
          sub="retrievePathshalaContext round trip"
        />
        <StatTile
          icon={
            overall.sparseSightings > 0 ? (
              <AlertTriangle size={16} className="text-red-700" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-700" />
            )
          }
          label="Sparse-Provider Sightings"
          value={String(overall.sparseSightings)}
          sub={
            overall.sparseSightings > 0
              ? "Unexpected -- sparse should be unregistered for these corpora"
              : "None seen -- cutover holding"
          }
          alert={overall.sparseSightings > 0}
        />
        <StatTile
          icon={<Database size={16} className="text-purple-700" />}
          label="Pending Source Flagged"
          value={`${overall.pendingSourcePct}%`}
          sub="Content awaiting source audit"
        />
      </div>

      {/* Corpus Breakdown */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/5">
          <h2 className="text-sm font-bold text-gray-900">Corpus Breakdown</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Avg top score and provider mix per corpus, over the full fetched window (not the table filter below).
          </p>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left px-4 py-2">Corpus</th>
              <th className="text-left px-4 py-2">Calls</th>
              <th className="text-left px-4 py-2">Avg Top Score</th>
              <th className="text-left px-4 py-2">Below Grounding Floor</th>
              <th className="text-left px-4 py-2">Provider Mix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {byCorpus.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No retrieval telemetry yet.
                </td>
              </tr>
            )}
            {byCorpus.map((row) => (
              <tr key={row.corpus}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{corpusLabel(row.corpus)}</td>
                <td className="px-4 py-2.5 text-gray-700">{row.count}</td>
                <td className="px-4 py-2.5 text-gray-700">{row.avgScore !== null ? row.avgScore.toFixed(2) : "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={row.belowFloorPct > 20 ? "text-red-700 font-bold" : "text-gray-700"}>
                    {row.belowFloorPct}%
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(row.providers).map(([provider, count]) => {
                      const { label, tone } = providerLabel(provider === "manifest-lookup" ? undefined : provider);
                      return (
                        <span key={provider} className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${tone}`}>
                          {label} &times;{count}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Recent Retrievals</h2>
            <p className="text-xs text-gray-500 mt-0.5">Most recent first.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCorpusFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                corpusFilter === "all" ? "bg-amber-100 border-amber-300 text-amber-900" : "border-black/10 text-gray-600"
              }`}
            >
              All
            </button>
            {corpora.map((c) => (
              <button
                key={c}
                onClick={() => setCorpusFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  corpusFilter === c ? "bg-amber-100 border-amber-300 text-amber-900" : "border-black/10 text-gray-600"
                }`}
              >
                {corpusLabel(c)}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="text-left px-4 py-2">Time</th>
                <th className="text-left px-4 py-2">Corpus</th>
                <th className="text-left px-4 py-2">Provider</th>
                <th className="text-left px-4 py-2">Top Score</th>
                <th className="text-left px-4 py-2">Chunks</th>
                <th className="text-left px-4 py-2">Latency</th>
                <th className="text-left px-4 py-2">Pending Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No events match this filter.
                  </td>
                </tr>
              )}
              {filteredEvents.slice(0, 100).map((e, i) => {
                const { label, tone } = providerLabel(e.provider);
                return (
                  <tr key={i}>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{corpusLabel(e.context?.corpus)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${tone}`}>{label}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {typeof e.context?.top_score === "number" ? e.context.top_score.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{e.context?.chunks_count ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-700 flex items-center gap-1">
                      <Clock size={11} className="text-gray-400" />
                      {typeof e.latency_ms === "number" ? `${e.latency_ms}ms` : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{e.context?.pending_source ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thresholds Reference */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
          <Search size={14} className="text-gray-500" />
          How dense retrieval is routed (reference)
        </h2>
        <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong>Bare chapter.verse citations</strong> (e.g. &quot;Gita 2.47&quot;) are detected and routed to the
            manifest/heuristic retriever, not dense embeddings -- a chapter/verse number carries no semantic content a
            sentence embedding can use.
          </li>
          <li>
            <strong>Natural-language questions</strong> get real dense retrieval (Xenova/all-MiniLM-L6-v2, 384-dim,
            in-process, no network call).
          </li>
          <li>
            <strong>Neighbor-splice trigger:</strong> top score &ge; 0.5 pulls in adjacent verses of the same doc.
          </li>
          <li>
            <strong>Tail-inclusion floor:</strong> 0.35 for additional supporting chunks.
          </li>
          <li>
            <strong>Groundedness gate</strong> (chat-grounding.ts, decides whether Dharma Mitra can cite scripture at
            all): 0.3 for these dense-routed corpora, unchanged 0.04 for corpora still on sparse TF-IDF (Gurbani,
            Buddhist, Jain).
          </li>
          <li>
            Rollback: the sparse retrievers and index files remain in <code>retrieval.ts</code>, unregistered but
            present -- swapping the two live <code>PramanaRetrieverSelector.register</code> calls back is a one-line
            change.
          </li>
        </ul>
      </div>

      {/* Raw Comparison Reports */}
      <ReportSection
        title="Gita: sparse vs. dense comparison report"
        content={gitaReport}
        open={showGitaReport}
        onToggle={() => setShowGitaReport((v) => !v)}
      />
      <ReportSection
        title="Upanishads: sparse vs. dense comparison report"
        content={upanishadsReport}
        open={showUpanishadsReport}
        onToggle={() => setShowUpanishadsReport((v) => !v)}
      />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl bg-white border shadow-sm flex flex-col justify-between ${
        alert ? "border-red-300" : "border-black/10"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold mt-2 ${alert ? "text-red-700" : "text-gray-900"}`}>{value}</div>
      <div className="text-[11px] text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

function ReportSection({
  title,
  content,
  open,
  onToggle,
}: {
  title: string;
  content: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-900">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-black/5 p-4 bg-gray-50/50 overflow-x-auto">
          {content ? (
            <pre className="text-[11px] leading-relaxed text-gray-700 whitespace-pre-wrap font-mono">{content}</pre>
          ) : (
            <p className="text-xs text-gray-400">
              Report file not found. Run the corresponding <code>scripts/compare_*.ts</code> script to regenerate it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
