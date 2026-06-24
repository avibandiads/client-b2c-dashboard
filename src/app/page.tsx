"use client";

import { useEffect, useState } from "react";
import type { ApiResponse } from "@/lib/types";
import DateFilter from "@/components/DateFilter";
import AccountGroup from "@/components/AccountGroup";

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
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [datePreset]);

  const totalAccounts = data?.data.length ?? 0;
  const totalCampaigns = data?.data.reduce((s, g) => s + g.campaigns.length, 0) ?? 0;
  const flaggedCount =
    data?.data.reduce(
      (s, g) => s + g.campaigns.filter((c) => c.cpl !== null && c.cpl > 100).length,
      0
    ) ?? 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CPL Dashboard</h1>
            {data && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last updated: {new Date(data.fetchedAt).toLocaleTimeString()} &middot;{" "}
                {totalAccounts} accounts &middot; {totalCampaigns} campaigns
                {flaggedCount > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    &middot; {flaggedCount} flagged (&gt;$100 CPL)
                  </span>
                )}
              </p>
            )}
          </div>
          <DateFilter value={datePreset} onChange={setDatePreset} />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse"
              >
                <div className="h-12 bg-gray-100" />
                <div className="px-4 py-3 space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-8 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <div className="space-y-6">
            {data.data.length === 0 ? (
              <p className="text-center text-gray-400 py-16">
                No active campaigns found for this period.
              </p>
            ) : (
              [...data.data]
                .sort((a, b) => {
                  const aActive = a.campaigns.length > 0;
                  const bActive = b.campaigns.length > 0;
                  if (aActive !== bActive) return aActive ? -1 : 1;
                  return a.accountName.localeCompare(b.accountName);
                })
                .map((group) => (
                  <AccountGroup key={group.accountId} group={group} />
                ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
