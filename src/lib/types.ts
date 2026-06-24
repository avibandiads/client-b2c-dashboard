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

export interface ClientPerformance {
  clientName: string;
  facebookAccountId: string;
  // Facebook metrics
  adSpend: number;
  leads: number;
  linkClicks: number;
  impressions: number;
  ctr: number | null;           // link clicks / impressions * 100
  cpc: number | null;           // spend / link clicks
  cpm: number | null;           // spend / impressions * 1000
  frequency: number | null;
  // GHL metrics
  requestedAppointments: number;
  // Calculated
  costPerLead: number | null;
  costPerAppointment: number | null;
  landingPageCvr: number | null;     // leads / link clicks * 100
  leadToAppointmentRate: number | null; // appointments / leads * 100
  // Analysis
  bottleneck: "creative" | "landing_page" | "appointment_funnel" | "healthy" | null;
  performance: "green" | "yellow" | "red" | "inactive";
}

export interface PerformanceResponse {
  data: ClientPerformance[];
  fetchedAt: string;
}

export interface DailyDataPoint {
  date: string;
  spend: number;
  leads: number;
  appointments: number;
  cpl: number | null;
  cpa: number | null;
}

export interface ClientDetailResponse {
  client: ClientPerformance;
  trend: DailyDataPoint[];
  campaigns: CampaignRow[];
  fetchedAt: string;
}
