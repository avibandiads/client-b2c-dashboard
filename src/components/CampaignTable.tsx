import type { CampaignRow } from "@/lib/types";
import CplBadge from "./CplBadge";

interface Props {
  campaigns: CampaignRow[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export default function CampaignTable({ campaigns, selectedIds, onToggle, onToggleAll }: Props) {
  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-gray-400 px-5 py-4 italic border-t border-gray-100">
        No activity this period.
      </p>
    );
  }

  const sorted = [...campaigns].sort((a, b) => {
    if (a.cpl === null && b.cpl === null) return 0;
    if (a.cpl === null) return 1;
    if (b.cpl === null) return -1;
    return b.cpl - a.cpl;
  });

  const allSelected = selectedIds.size === campaigns.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-400 text-left text-xs uppercase tracking-wider">
            <th className="pl-5 pr-2 py-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={onToggleAll}
                className="rounded border-gray-300 text-slate-700 focus:ring-slate-400 cursor-pointer"
              />
            </th>
            <th className="px-2 py-2 font-medium">Campaign</th>
            <th className="px-4 py-2 font-medium text-right">Spend</th>
            <th className="px-4 py-2 font-medium text-right">Leads</th>
            <th className="px-4 py-2 font-medium text-right">CPL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((row) => {
            const flagged = row.cpl !== null && row.cpl > 100;
            const checked = selectedIds.has(row.campaignId);
            return (
              <tr
                key={row.campaignId}
                onClick={() => onToggle(row.campaignId)}
                className={`cursor-pointer transition-colors ${
                  checked ? "bg-slate-50" : flagged ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-gray-50"
                }`}
              >
                <td className="pl-5 pr-2 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(row.campaignId)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-slate-700 focus:ring-slate-400 cursor-pointer"
                  />
                </td>
                <td className="px-2 py-2.5 max-w-sm truncate text-gray-700" title={row.campaignName}>
                  {row.campaignName}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">
                  ${row.spend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">{row.leads}</td>
                <td className="px-4 py-2.5 text-right">
                  <CplBadge cpl={row.cpl} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
