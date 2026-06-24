export interface CampaignRow {
  campaignId: string;
  campaignName: string;
  spend: number;
  leads: number;
  cpl: number | null;
}

export interface AccountGroup {
  accountId: string;
  accountName: string;
  campaigns: CampaignRow[];
  totalSpend: number;
  totalLeads: number;
  avgCpl: number | null;
}

export interface ApiResponse {
  data: AccountGroup[];
  fetchedAt: string;
}
