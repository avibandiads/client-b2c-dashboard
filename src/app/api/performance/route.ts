import { NextRequest, NextResponse } from "next/server";
import { CLIENTS } from "@/lib/clients";
import { fetchAccountMetrics } from "@/lib/facebook";
import { fetchAppointmentCount } from "@/lib/gohighlevel";
import { detectBottleneck, scorePerformance } from "@/lib/benchmarks";
import type { ClientPerformance, PerformanceResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_PRESETS = new Set(["today", "yesterday", "last_7d", "last_14d", "last_30d"]);

export async function GET(req: NextRequest) {
  const fbToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const ghlToken = process.env.GHL_API_KEY;

  if (!fbToken) {
    return NextResponse.json({ error: "Missing FACEBOOK_ACCESS_TOKEN" }, { status: 500 });
  }

  const datePreset = req.nextUrl.searchParams.get("datePreset") ?? "last_7d";
  if (!VALID_PRESETS.has(datePreset)) {
    return NextResponse.json({ error: "Invalid datePreset" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    CLIENTS.map(async (client): Promise<ClientPerformance> => {
      const [fbMetrics, appointments] = await Promise.allSettled([
        fetchAccountMetrics(client.facebookAccountId, datePreset, fbToken),
        ghlToken
          ? fetchAppointmentCount(client.ghlLocationId, datePreset, ghlToken)
          : Promise.resolve(0),
      ]);

      const fb = fbMetrics.status === "fulfilled"
        ? fbMetrics.value
        : { adSpend: 0, leads: 0, linkClicks: 0, impressions: 0, cpm: null, frequency: null, ctr: null, cpc: null };

      const appts = appointments.status === "fulfilled" ? appointments.value : 0;

      const costPerLead = fb.leads > 0 ? fb.adSpend / fb.leads : null;
      const costPerAppointment = appts > 0 ? fb.adSpend / appts : null;
      const landingPageCvr = fb.linkClicks > 0 ? (fb.leads / fb.linkClicks) * 100 : null;
      const leadToAppointmentRate = fb.leads > 0 ? (appts / fb.leads) * 100 : null;

      const bottleneck = detectBottleneck(fb.ctr, landingPageCvr, leadToAppointmentRate, fb.leads);
      const performance = scorePerformance(costPerLead, costPerAppointment, fb.adSpend);

      return {
        clientName: client.name,
        facebookAccountId: client.facebookAccountId,
        adSpend: fb.adSpend,
        leads: fb.leads,
        linkClicks: fb.linkClicks,
        impressions: fb.impressions,
        ctr: fb.ctr,
        cpc: fb.cpc,
        cpm: fb.cpm,
        frequency: fb.frequency,
        requestedAppointments: appts,
        costPerLead,
        costPerAppointment,
        landingPageCvr,
        leadToAppointmentRate,
        bottleneck,
        performance,
      };
    }),
  );

  const data: ClientPerformance[] = results
    .filter((r): r is PromiseFulfilledResult<ClientPerformance> => r.status === "fulfilled")
    .map((r) => r.value);

  results
    .filter((r) => r.status === "rejected")
    .forEach((r) => console.error("Client fetch failed:", (r as PromiseRejectedResult).reason));

  const response: PerformanceResponse = { data, fetchedAt: new Date().toISOString() };
  return NextResponse.json(response, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
