import type { AccountGroup as AccountGroupType } from "@/lib/types";
import CampaignTable from "./CampaignTable";
import CplBadge from "./CplBadge";

interface Props {
  group: AccountGroupType;
}

export default function AccountGroup({ group }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-6">
        <span className="font-semibold text-gray-800 text-sm">
          {group.accountName}
        </span>
        <div className="flex gap-6 text-sm text-gray-600 ml-auto">
          <span>
            <span className="text-gray-400 mr-1">Spend:</span>
            <span className="font-medium text-gray-800">
              ${group.totalSpend.toFixed(2)}
            </span>
          </span>
          <span>
            <span className="text-gray-400 mr-1">Leads:</span>
            <span className="font-medium text-gray-800">{group.totalLeads}</span>
          </span>
          <span>
            <span className="text-gray-400 mr-1">Avg CPL:</span>
            <CplBadge cpl={group.avgCpl} />
          </span>
          <span>
            <span className="text-gray-400 mr-1">Campaigns:</span>
            <span className="font-medium text-gray-800">{group.campaigns.length}</span>
          </span>
        </div>
      </div>
      <CampaignTable campaigns={group.campaigns} />
    </div>
  );
}
