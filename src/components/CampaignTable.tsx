import type { CampaignRow } from "@/lib/types";
import CplBadge from "./CplBadge";

interface Props {
  campaigns: CampaignRow[];
}

export default function CampaignTable({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-gray-400 px-4 py-3">
        No active campaigns in this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left text-xs uppercase tracking-wide">
            <th className="px-4 py-2 font-medium">Campaign Name</th>
            <th className="px-4 py-2 font-medium text-right">Spend</th>
            <th className="px-4 py-2 font-medium text-right">Leads</th>
            <th className="px-4 py-2 font-medium text-right">CPL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {campaigns.map((row) => (
            <tr key={row.campaignId} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 max-w-xs truncate text-gray-800" title={row.campaignName}>
                {row.campaignName}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-700">
                ${row.spend.toFixed(2)}
              </td>
              <td className="px-4 py-2.5 text-right text-gray-700">{row.leads}</td>
              <td className="px-4 py-2.5 text-right">
                <CplBadge cpl={row.cpl} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
