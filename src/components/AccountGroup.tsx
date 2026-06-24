"use client";

import { useState } from "react";
import type { AccountGroup as AccountGroupType } from "@/lib/types";
import CampaignTable from "./CampaignTable";
import CplBadge from "./CplBadge";

interface Props {
  group: AccountGroupType;
  defaultOpen?: boolean;
}

export default function AccountGroup({ group, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasActivity = group.campaigns.length > 0;
  const hasFlagged = group.campaigns.some((c) => c.cpl !== null && c.cpl > 100);
  const selectedCount = selectedIds.size;

  const toggleCampaign = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === group.campaigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(group.campaigns.map((c) => c.campaignId)));
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden ${hasFlagged ? "border-red-200" : "border-gray-200"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        <span className="font-semibold text-gray-900 text-sm flex-1">{group.accountName}</span>

        {selectedCount > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
            {selectedCount} selected
          </span>
        )}

        {hasFlagged && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" title="Has flagged campaigns" />
        )}

        {!hasActivity ? (
          <span className="text-xs text-gray-400 ml-auto">No activity</span>
        ) : (
          <div className="flex items-center gap-5 text-sm ml-auto">
            <span className="hidden sm:block text-gray-400 text-xs">
              {group.campaigns.length} campaign{group.campaigns.length !== 1 ? "s" : ""}
            </span>
            <span>
              <span className="text-gray-400 text-xs mr-1">Spend</span>
              <span className="font-medium text-gray-800 tabular-nums">
                ${group.totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
            <span>
              <span className="text-gray-400 text-xs mr-1">Leads</span>
              <span className="font-medium text-gray-800 tabular-nums">{group.totalLeads}</span>
            </span>
            <span>
              <span className="text-gray-400 text-xs mr-1">Avg CPL</span>
              <CplBadge cpl={group.avgCpl} size="sm" />
            </span>
          </div>
        )}
      </button>

      {open && (
        <CampaignTable
          campaigns={group.campaigns}
          selectedIds={selectedIds}
          onToggle={toggleCampaign}
          onToggleAll={toggleAll}
        />
      )}
    </div>
  );
}
