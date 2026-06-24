import type { AccountGroup, CampaignRow } from "./types";

const FB_API = "https://graph.facebook.com/v19.0";

interface FbAction {
  action_type: string;
  value: string;
}

// ── Account-level overview (one record per account) ──────────────────────────

interface FbAccountInsight {
  spend: string;
  impressions: string;
  link_clicks?: string;
  cpm?: string;
  frequency?: string;
  actions?: FbAction[];
}

export interface FbAccountMetrics {
  adSpend: number;
  leads: number;
  linkClicks: number;
  impressions: number;
  cpm: number | null;
  frequency: number | null;
  ctr: number | null;   // calculated: link_clicks / impressions * 100
  cpc: number | null;   // calculated: spend / link_clicks
}

export async function fetchAccountMetrics(
  rawAccountId: string,
  datePreset: string,
  token: string,
): Promise<FbAccountMetrics> {
  const accountId = rawAccountId.trim().startsWith("act_")
    ? rawAccountId.trim()
    : `act_${rawAccountId.trim()}`;

  const params = new URLSearchParams({
    level: "account",
    fields: "spend,impressions,inline_link_clicks,cpm,frequency,actions",
    date_preset: datePreset,
    access_token: token,
  });

  const res = await fetch(`${FB_API}/${accountId}/insights?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Facebook API error for ${accountId}: ${res.status} ${body}`);
  }

  const json = await res.json();
  const row: FbAccountInsight = json.data?.[0] ?? {};

  const adSpend = parseFloat(row.spend ?? "0");
  const impressions = parseInt(row.impressions ?? "0", 10);
  const linkClicks = parseInt((row as { inline_link_clicks?: string }).inline_link_clicks ?? "0", 10);
  const cpm = row.cpm ? parseFloat(row.cpm) : null;
  const frequency = row.frequency ? parseFloat(row.frequency) : null;
  const leads = row.actions?.find((a) => a.action_type === "lead")
    ? parseInt(row.actions.find((a) => a.action_type === "lead")!.value, 10)
    : 0;

  const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : null;
  const cpc = linkClicks > 0 ? adSpend / linkClicks : null;

  return { adSpend, leads, linkClicks, impressions, cpm, frequency, ctr, cpc };
}

// ── Campaign-level detail (for the detail page) ───────────────────────────────

interface FbCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  actions?: FbAction[];
}

interface FbInsightsResponse {
  data: FbCampaignInsight[];
  paging?: { cursors: { after: string }; next?: string };
}

export async function fetchCampaignInsights(
  rawAccountId: string,
  datePreset: string,
  token: string,
): Promise<{ campaigns: CampaignRow[]; accountGroup: AccountGroup }> {
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
    return {
      campaignId: insight.campaign_id,
      campaignName: insight.campaign_name,
      spend,
      leads,
      cpl: leads > 0 ? spend / leads : null,
    };
  });

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);

  return {
    campaigns,
    accountGroup: {
      accountId,
      accountName: accountId,
      campaigns,
      totalSpend,
      totalLeads,
      avgCpl: totalLeads > 0 ? totalSpend / totalLeads : null,
    },
  };
}

// ── Daily time-series (for trend charts) ─────────────────────────────────────

export interface FbDailyRow {
  date: string;
  spend: number;
  leads: number;
  linkClicks: number;
}

export async function fetchDailyInsights(
  rawAccountId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  token: string,
): Promise<FbDailyRow[]> {
  const accountId = rawAccountId.trim().startsWith("act_")
    ? rawAccountId.trim()
    : `act_${rawAccountId.trim()}`;

  const params = new URLSearchParams({
    level: "account",
    fields: "spend,inline_link_clicks,actions",
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    time_increment: "1",
    access_token: token,
    limit: "90",
  });

  const res = await fetch(`${FB_API}/${accountId}/insights?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`FB daily fetch error for ${accountId}: ${res.status}`);
    return [];
  }

  const json = await res.json();

  return (json.data ?? []).map((row: FbCampaignInsight & { date_start: string; link_clicks?: string }) => {
    const spend = parseFloat(row.spend ?? "0");
    const linkClicks = parseInt((row as { inline_link_clicks?: string }).inline_link_clicks ?? "0", 10);
    const leads = row.actions?.find((a) => a.action_type === "lead")
      ? parseInt(row.actions.find((a) => a.action_type === "lead")!.value, 10)
      : 0;
    return { date: (row as { date_start: string }).date_start, spend, leads, linkClicks };
  });
}
