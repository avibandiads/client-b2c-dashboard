import { NextRequest, NextResponse } from "next/server";
import { CLIENTS } from "@/lib/clients";
import { fetchAccountMetrics, fetchCampaignInsights, fetchDailyInsights } from "@/lib/facebook";
import { fetchAppointmentCount, fetchDailyAppointments } from "@/lib/gohighlevel";
import { detectBottleneck, scorePerformance } from "@/lib/benchmarks";
import type { ClientDetailResponse, ClientPerformance, DailyDataPoint } from "@/lib/types";

export const dynamic = "force-dynamic";

function last30DayRange(): { startDate: string; endDate: string; startObj: Date; endObj: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end), startObj: start, endObj: end };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const fbToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const ghlToken = process.env.GHL_API_KEY;
  if (!fbToken) return NextResponse.json({ error: "Missing FACEBOOK_ACCESS_TOKEN" }, { status: 500 });

  const accountId = decodeURIComponent(params.accountId);
  const client = CLIENTS.find((c) => c.facebookAccountId === accountId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const datePreset = req.nextUrl.searchParams.get("datePreset") ?? "last_30d";
  const { startDate, endDate, startObj, endObj } = last30DayRange();

  const [fbMetrics, fbCampaigns, fbDaily, apptTotal, ghlDaily] = await Promise.allSettled([
    fetchAccountMetrics(client.facebookAccountId, datePreset, fbToken),
    fetchCampaignInsights(client.facebookAccountId, datePreset, fbToken),
    fetchDailyInsights(client.facebookAccountId, startDate, endDate, fbToken),
    ghlToken ? fetchAppointmentCount(client.ghlLocationId, datePreset, ghlToken) : Promise.resolve(0),
    ghlToken ? fetchDailyAppointments(client.ghlLocationId, startObj, endObj, ghlToken) : Promise.resolve({} as Record<string, number>),
  ]);

  const fb = fbMetrics.status === "fulfilled" ? fbMetrics.value
    : { adSpend: 0, leads: 0, linkClicks: 0, impressions: 0, cpm: null, frequency: null, ctr: null, cpc: null };
  const campaigns = fbCampaigns.status === "fulfilled" ? fbCampaigns.value.campaigns : [];
  const dailyFb = fbDaily.status === "fulfilled" ? fbDaily.value : [];
  const appts = apptTotal.status === "fulfilled" ? apptTotal.value : 0;
  const dailyAppts = ghlDaily.status === "fulfilled" ? ghlDaily.value : {};

  const costPerLead = fb.leads > 0 ? fb.adSpend / fb.leads : null;
  const costPerAppointment = appts > 0 ? fb.adSpend / appts : null;
  const landingPageCvr = fb.linkClicks > 0 ? (fb.leads / fb.linkClicks) * 100 : null;
  const leadToAppointmentRate = fb.leads > 0 ? (appts / fb.leads) * 100 : null;

  const clientPerf: ClientPerformance = {
    clientName: client.name,
    facebookAccountId: client.facebookAccountId,
    ...fb,
    requestedAppointments: appts,
    costPerLead,
    costPerAppointment,
    landingPageCvr,
    leadToAppointmentRate,
    bottleneck: detectBottleneck(fb.ctr, landingPageCvr, leadToAppointmentRate, fb.leads),
    performance: scorePerformance(costPerLead, costPerAppointment, fb.adSpend),
  };

  const trend: DailyDataPoint[] = dailyFb.map((row) => {
    const dayAppts = dailyAppts[row.date] ?? 0;
    return {
      date: row.date,
      spend: row.spend,
      leads: row.leads,
      appointments: dayAppts,
      cpl: row.leads > 0 ? row.spend / row.leads : null,
      cpa: dayAppts > 0 ? row.spend / dayAppts : null,
    };
  });

  const response: ClientDetailResponse = {
    client: clientPerf,
    trend,
    campaigns,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
