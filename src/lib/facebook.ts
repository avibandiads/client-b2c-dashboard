import type { AccountGroup, CampaignRow } from "./types";

const FB_API = "https://graph.facebook.com/v19.0";

const ACCOUNT_NAMES: Record<string, string> = {
  act_1508443064618006: "Ashley Homes",
  act_1460663760738532: "Amba Homes",
  act_205945197288862: "Ad Account 1",
  act_404762827188746: "Showroom Windows & Doors",
  act_3823605791197742: "Gold Standard Bathrooms",
  act_1914952309266121: "New Bandi Ads Lead Gen",
  act_24099973656298447: "New Amba Homes",
  act_24852403281018487: "Heartland Remodeling",
  act_2021251812050853: "Cabinet Creations Plus",
  act_1467325234789304: "Midway Remodeling",
  act_3783307961971899: "Alamo City Exteriors and Baths",
  act_3613277475476712: "Inside Out Home Solutions",
  act_1900028590678897: "MulchMasters MN",
  act_804459515609876: "Top Notch Construction",
  act_1376496411033926: "Marblecast of Michigan",
  act_1510374447243090: "Kustom Kitchens",
  act_28389345204035132: "UpRight Restorations",
  act_2345319459291850: "Apex Shower & Bath",
  act_919498947716208: "Polaris Bath",
  act_2719181351815196: "Ances Stone",
};

interface FbAction {
  action_type: string;
  value: string;
}

interface FbInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  actions?: FbAction[];
}

interface FbInsightsResponse {
  data: FbInsight[];
  paging?: { cursors: { after: string }; next?: string };
}

export async function fetchAccountInsights(
  rawAccountId: string,
  datePreset: string,
  token: string
): Promise<AccountGroup> {
  const accountId = rawAccountId.trim().startsWith("act_")
    ? rawAccountId.trim()
    : `act_${rawAccountId.trim()}`;

  const params = new URLSearchParams({
    level: "campaign",
    fields: "campaign_id,campaign_name,spend,actions",
    date_preset: datePreset,
    access_token: token,
    limit: "500",
  });

  const res = await fetch(`${FB_API}/${accountId}/insights?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Facebook API error for ${accountId}: ${res.status} ${body}`);
  }

  const json: FbInsightsResponse = await res.json();

  const campaigns: CampaignRow[] = (json.data ?? []).map((insight) => {
    const spend = parseFloat(insight.spend ?? "0");
    const leadAction = insight.actions?.find((a) => a.action_type === "lead");
    const leads = leadAction ? parseInt(leadAction.value, 10) : 0;
    const cpl = leads > 0 ? spend / leads : null;

    return {
      campaignId: insight.campaign_id,
      campaignName: insight.campaign_name,
      spend,
      leads,
      cpl,
    };
  });

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : null;

  const accountName = ACCOUNT_NAMES[accountId] ?? accountId;

  return { accountId, accountName, campaigns, totalSpend, totalLeads, avgCpl };
}
