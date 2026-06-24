import type { ClientPerformance } from "./types";

export const BENCHMARKS = {
  ctr:            0.92, // link CTR % — below = creative problem
  landingPageCvr: 2.0,  // leads / link clicks % — below = landing page problem
  leadToApptRate: 40,   // appointments / leads % — below = appointment funnel problem
  cpm:  { good: 50,  warn: 80  },
  cpl:  { good: 100, warn: 150 },
  cpa:  { good: 200, warn: 350 },
};

export function detectBottleneck(
  ctr: number | null,
  lpCvr: number | null,
  leadToAppt: number | null,
  leads: number,
): ClientPerformance["bottleneck"] {
  if (leads === 0) return null;
  if (ctr !== null && ctr < BENCHMARKS.ctr) return "creative";
  if (lpCvr !== null && lpCvr < BENCHMARKS.landingPageCvr) return "landing_page";
  if (leadToAppt !== null && leadToAppt < BENCHMARKS.leadToApptRate) return "appointment_funnel";
  return "healthy";
}

export function scorePerformance(
  cpl: number | null,
  cpa: number | null,
  adSpend: number,
): ClientPerformance["performance"] {
  if (adSpend === 0) return "inactive";
  if (
    (cpl !== null && cpl > BENCHMARKS.cpl.warn) ||
    (cpa !== null && cpa > BENCHMARKS.cpa.warn)
  ) return "red";
  if (
    (cpl !== null && cpl > BENCHMARKS.cpl.good) ||
    (cpa !== null && cpa > BENCHMARKS.cpa.good)
  ) return "yellow";
  return "green";
}
