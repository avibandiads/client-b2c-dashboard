import { NextRequest, NextResponse } from "next/server";
import { fetchCampaignInsights as fetchAccountInsights } from "@/lib/facebook";
import type { ApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_PRESETS = new Set([
  "today",
  "yesterday",
  "last_7d",
  "last_14d",
  "last_30d",
]);

export async function GET(req: NextRequest) {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  const accountIdsRaw = process.env.FACEBOOK_AD_ACCOUNT_IDS;

  if (!token || !accountIdsRaw) {
    return NextResponse.json(
      { error: "Missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_AD_ACCOUNT_IDS env vars" },
      { status: 500 }
    );
  }

  const datePreset = req.nextUrl.searchParams.get("datePreset") ?? "last_7d";
  if (!VALID_PRESETS.has(datePreset)) {
    return NextResponse.json({ error: "Invalid datePreset" }, { status: 400 });
  }

  const accountIds = accountIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const results = await Promise.allSettled(
    accountIds.map(async (id) => {
      const result = await fetchAccountInsights(id, datePreset, token);
      return result.accountGroup;
    })
  );

  const data = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchAccountInsights>>["accountGroup"]> => r.status === "fulfilled")
    .map((r) => r.value);

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    failed.forEach((r) => {
      if (r.status === "rejected") console.error("Account fetch failed:", r.reason);
    });
  }

  const response: ApiResponse = { data, fetchedAt: new Date().toISOString() };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
