"use client";

import { useEffect, useState } from "react";
import type { ApiResponse, CampaignRow } from "@/lib/types";
import DateFilter from "@/components/DateFilter";
import AccountGroup from "@/components/AccountGroup";
import CplBadge from "@/components/CplBadge";

type FlaggedRow = CampaignRow & { accountName: string };

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
  const [datePreset, setDatePreset] = useState("last_7d");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/campaigns?datePreset=${datePreset}`)
      .then((res) => {
        if (!res.ok) return res.json().then((j) => Promise.reject(j.error ?? "API error"));
        return res.json() as Promise<ApiResponse>;
      })
      .then((json) => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(String(err)); setLoading(false); } });

    return () => { cancelled = true; };
  }, [datePreset]);

  const accounts = data?.data ?? [];
  const activeAccounts = accounts.filter((g) => g.campaigns.length > 0);
  const totalSpend = accounts.reduce((s, g) => s + g.totalSpend, 0);
  const totalLeads = accounts.reduce((s, g) => s + g.totalLeads, 0);
  const blendedCpl = totalLeads > 0 ? totalSpend / totalLeads : null;

  const flagged: FlaggedRow[] = accounts
    .flatMap((g) =>
      g.campaigns
        .filter((c) => c.cpl !== null && c.cpl > 100)
        .map((c) => ({ ...c, accountName: g.accountName }))
    )
    .sort((a, b) => (b.cpl ?? 0) - (a.cpl ?? 0));

  const [search, setSearch] = useState("");

  const sorted = [...accounts]
    .filter((g) => g.accountName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aActive = a.campaigns.length > 0;
      const bActive = b.campaigns.length > 0;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return a.accountName.localeCompare(b.accountName);
    });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Bandi Ads — CPL Dashboard</h1>
          {data && !loading && (
            <p className="text-xs text-slate-400 mt-0.5">
              Updated {new Date(data.fetchedAt).toLocaleTimeString()} &middot; {activeAccounts.length} of {accounts.length} accounts active
            </p>
          )}
        </div>
        <DateFilter value={datePreset} onChange={setDatePreset} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-200" />)}
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-12 bg-white rounded-lg border border-gray-200" />)}
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Active Accounts"
                value={String(activeAccounts.length)}
                sub={`of ${accounts.length} total`}
              />
              <StatCard
                label="Total Spend"
                value={`$${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <StatCard
                label="Total Leads"
                value={String(totalLeads)}
              />
              <StatCard
                label="Blended CPL"
                value={blendedCpl !== null ? `$${blendedCpl.toFixed(2)}` : "—"}
              />
            </div>

            {/* Needs Attention */}
            {flagged.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
                  <span className="text-red-600 font-semibold text-sm">Needs Attention</span>
                  <span className="text-red-400 text-xs">
                    {flagged.length} campaign{flagged.length !== 1 ? "s" : ""} over $100 CPL
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {flagged.map((c) => (
                    <div key={c.campaignId} className="px-5 py-2.5 flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-800 w-40 flex-shrink-0 truncate" title={c.accountName}>
                        {c.accountName}
                      </span>
                      <span className="text-gray-500 flex-1 truncate text-xs" title={c.campaignName}>
                        {c.campaignName}
                      </span>
                      <span className="text-gray-400 text-xs tabular-nums hidden sm:block">
                        ${c.spend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spend
                      </span>
                      <span className="text-gray-400 text-xs tabular-nums hidden sm:block">{c.leads} leads</span>
                      <CplBadge cpl={c.cpl} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account search + list */}
            <div className="space-y-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search accounts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {sorted.length === 0 ? (
                <p className="text-center text-gray-400 py-16">
                  {search ? `No accounts matching "${search}"` : "No data for this period."}
                </p>
              ) : (
                sorted.map((group) => (
                  <AccountGroup key={group.accountId} group={group} defaultOpen={false} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
