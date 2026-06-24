"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientPerformance, PerformanceResponse } from "@/lib/types";
import DateFilter from "@/components/DateFilter";
import BottleneckBadge from "@/components/BottleneckBadge";

function fmt$(n: number | null) {
  if (n === null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number | null) {
  if (n === null) return "—";
  return n.toFixed(2) + "%";
}
function fmtN(n: number) {
  return n.toLocaleString("en-US");
}

const PERF_ROW: Record<ClientPerformance["performance"], string> = {
  green:    "border-l-4 border-l-green-400",
  yellow:   "border-l-4 border-l-yellow-400",
  red:      "border-l-4 border-l-red-400",
  inactive: "border-l-4 border-l-gray-200 opacity-60",
};

const PERF_DOT: Record<ClientPerformance["performance"], string> = {
  green:    "bg-green-400",
  yellow:   "bg-yellow-400",
  red:      "bg-red-500",
  inactive: "bg-gray-300",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [datePreset, setDatePreset] = useState("last_7d");
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/performance?datePreset=${datePreset}`)
      .then((r) => r.ok ? r.json() : r.json().then((j: { error?: string }) => Promise.reject(j.error ?? "API error")))
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(String(err)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [datePreset]);

  const clients = data?.data ?? [];
  const active = clients.filter((c) => c.adSpend > 0);
  const totalSpend = clients.reduce((s, c) => s + c.adSpend, 0);
  const totalLeads = clients.reduce((s, c) => s + c.leads, 0);
  const totalAppts = clients.reduce((s, c) => s + c.requestedAppointments, 0);
  const blendedCpl = totalLeads > 0 ? totalSpend / totalLeads : null;
  const blendedCpa = totalAppts > 0 ? totalSpend / totalAppts : null;
  const redClients = clients.filter((c) => c.performance === "red");

  const visible = clients
    .filter((c) => c.clientName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.performance === "inactive" && b.performance !== "inactive") return 1;
      if (b.performance === "inactive" && a.performance !== "inactive") return -1;
      return a.clientName.localeCompare(b.clientName);
    });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Bandi Ads — Agency Dashboard</h1>
          {data && !loading && (
            <p className="text-xs text-slate-400 mt-0.5">
              Updated {new Date(data.fetchedAt).toLocaleTimeString()} · {active.length} of {clients.length} accounts active
            </p>
          )}
        </div>
        <DateFilter value={datePreset} onChange={setDatePreset} />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-200" />)}
            </div>
            <div className="h-96 bg-white rounded-xl border border-gray-200" />
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatCard label="Active Accounts" value={String(active.length)} sub={`of ${clients.length} total`} />
              <StatCard label="Total Spend" value={fmt$(totalSpend)} />
              <StatCard label="Total Leads" value={fmtN(totalLeads)} />
              <StatCard label="Total Appointments" value={fmtN(totalAppts)} />
              <StatCard label="Blended CPL / CPA" value={`${fmt$(blendedCpl)} / ${fmt$(blendedCpa)}`} />
            </div>

            {/* Needs attention */}
            {redClients.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
                  <span className="text-red-600 font-semibold text-sm">Needs Attention</span>
                  <span className="text-red-400 text-xs">{redClients.length} client{redClients.length !== 1 ? "s" : ""} significantly off benchmark</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {redClients.map((c) => (
                    <div key={c.facebookAccountId} className="px-5 py-2.5 flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/client/${c.facebookAccountId}`)}>
                      <span className="font-medium text-gray-800 w-44 flex-shrink-0 truncate">{c.clientName}</span>
                      <BottleneckBadge bottleneck={c.bottleneck} />
                      <span className="text-gray-400 text-xs ml-auto">CPL {fmt$(c.costPerLead)} · CPA {fmt$(c.costPerAppointment)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text" placeholder="Search clients…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Overview table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="pl-5 pr-3 py-3 text-left font-medium w-4"></th>
                      <th className="px-3 py-3 text-left font-medium min-w-[160px]">Client</th>
                      <th className="px-3 py-3 text-right font-medium">Spend</th>
                      <th className="px-3 py-3 text-right font-medium">Leads</th>
                      <th className="px-3 py-3 text-right font-medium">Appts</th>
                      <th className="px-3 py-3 text-right font-medium">CPL</th>
                      <th className="px-3 py-3 text-right font-medium">CPA</th>
                      <th className="px-3 py-3 text-right font-medium">LP CVR</th>
                      <th className="px-3 py-3 text-right font-medium">Lead→Appt</th>
                      <th className="px-3 py-3 text-right font-medium">CTR</th>
                      <th className="px-3 py-3 text-right font-medium">CPC</th>
                      <th className="px-3 py-3 text-right font-medium">CPM</th>
                      <th className="px-3 py-3 text-right font-medium">Freq</th>
                      <th className="px-3 py-3 text-left font-medium">Bottleneck</th>
                      <th className="pr-5 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.length === 0 ? (
                      <tr><td colSpan={15} className="text-center text-gray-400 py-12">No clients match &ldquo;{search}&rdquo;</td></tr>
                    ) : (
                      visible.map((c) => (
                        <tr
                          key={c.facebookAccountId}
                          onClick={() => router.push(`/client/${c.facebookAccountId}`)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${PERF_ROW[c.performance]}`}
                        >
                          <td className="pl-5 pr-3 py-3">
                            <span className={`block w-2 h-2 rounded-full ${PERF_DOT[c.performance]}`} />
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-900">{c.clientName}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-700">{fmt$(c.adSpend)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-700">{fmtN(c.leads)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-700">{fmtN(c.requestedAppointments)}</td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium text-gray-800">{fmt$(c.costPerLead)}</td>
                          <td className="px-3 py-3 text-right tabular-nums font-medium text-gray-800">{fmt$(c.costPerAppointment)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{fmtPct(c.landingPageCvr)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{fmtPct(c.leadToAppointmentRate)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{fmtPct(c.ctr)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{fmt$(c.cpc)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{fmt$(c.cpm)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-gray-600">{c.frequency?.toFixed(2) ?? "—"}</td>
                          <td className="px-3 py-3"><BottleneckBadge bottleneck={c.bottleneck} /></td>
                          <td className="pr-5 py-3 text-right text-gray-300">→</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
