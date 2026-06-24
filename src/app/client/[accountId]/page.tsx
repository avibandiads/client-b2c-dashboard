"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ClientDetailResponse } from "@/lib/types";
import BottleneckBadge from "@/components/BottleneckBadge";
import CampaignTable from "@/components/CampaignTable";
import TrendChart from "@/components/TrendChart";
import DateFilter from "@/components/DateFilter";

function fmt$(n: number | null) {
  if (n === null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number | null) {
  if (n === null) return "—";
  return n.toFixed(2) + "%";
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ClientDetail({ params }: { params: { accountId: string } }) {
  const router = useRouter();
  const [datePreset, setDatePreset] = useState("last_30d");
  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const accountId = params.accountId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/client/${accountId}?datePreset=${datePreset}`)
      .then((r) => r.ok ? r.json() : r.json().then((j: { error?: string }) => Promise.reject(j.error ?? "API error")))
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(String(err)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [accountId, datePreset]);

  const c = data?.client;

  const toggleCampaign = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    const all = data?.campaigns ?? [];
    setSelectedIds(selectedIds.size === all.length ? new Set() : new Set(all.map((x) => x.campaignId)));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-slate-900 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push("/")} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white">
            {c?.clientName ?? "Loading…"}
          </h1>
          {data && <p className="text-xs text-slate-400 mt-0.5">Updated {new Date(data.fetchedAt).toLocaleTimeString()}</p>}
        </div>
        <DateFilter value={datePreset} onChange={setDatePreset} />
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-200" />)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-44 bg-white rounded-xl border border-gray-200" />)}
            </div>
          </div>
        )}

        {!loading && !error && data && c && (
          <>
            {/* Bottleneck */}
            <div className="flex items-center gap-3">
              <BottleneckBadge bottleneck={c.bottleneck} />
              {c.bottleneck === "creative" && <p className="text-sm text-gray-500">CTR is below benchmark — ad creative needs attention.</p>}
              {c.bottleneck === "landing_page" && <p className="text-sm text-gray-500">Clicks are coming in but the landing page isn&apos;t converting.</p>}
              {c.bottleneck === "appointment_funnel" && <p className="text-sm text-gray-500">Leads are coming in but not enough are booking appointments.</p>}
              {c.bottleneck === "healthy" && <p className="text-sm text-gray-500">All key metrics are within benchmarks.</p>}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Ad Spend"       value={fmt$(c.adSpend)} />
              <KpiCard label="Leads"          value={String(c.leads)} />
              <KpiCard label="Appointments"   value={String(c.requestedAppointments)} />
              <KpiCard label="CPL"            value={fmt$(c.costPerLead)} />
              <KpiCard label="CPA"            value={fmt$(c.costPerAppointment)} />
              <KpiCard label="LP Conversion"  value={fmtPct(c.landingPageCvr)} />
              <KpiCard label="Lead → Appt"    value={fmtPct(c.leadToAppointmentRate)} />
              <KpiCard label="CTR / CPM / Freq" value={`${fmtPct(c.ctr)} / ${fmt$(c.cpm)} / ${c.frequency?.toFixed(2) ?? "—"}`} />
            </div>

            {/* Trend charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TrendChart data={data.trend} metric="leads"        label="Daily Leads"        color="#6366f1" />
              <TrendChart data={data.trend} metric="appointments" label="Daily Appointments"  color="#10b981" />
              <TrendChart data={data.trend} metric="cpl"          label="CPL Trend"           color="#f59e0b" />
              <TrendChart data={data.trend} metric="cpa"          label="CPA Trend"           color="#ef4444" />
            </div>

            {/* Campaign breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-sm">Campaign Breakdown</span>
                {selectedIds.size > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
              <CampaignTable
                campaigns={data.campaigns}
                selectedIds={selectedIds}
                onToggle={toggleCampaign}
                onToggleAll={toggleAll}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
