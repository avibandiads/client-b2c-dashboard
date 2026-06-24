import type { ClientPerformance } from "@/lib/types";

const CONFIG: Record<
  NonNullable<ClientPerformance["bottleneck"]>,
  { label: string; description: string; color: string }
> = {
  creative:            { label: "Creative",         description: "Low CTR — Ad creative needs work",               color: "bg-orange-100 text-orange-700" },
  landing_page:        { label: "Landing Page",     description: "Good CTR but low landing page conversion",       color: "bg-yellow-100 text-yellow-700" },
  appointment_funnel:  { label: "Appt Funnel",      description: "Good leads but low appointment request rate",    color: "bg-blue-100 text-blue-700" },
  healthy:             { label: "Healthy",           description: "All metrics within benchmarks",                  color: "bg-green-100 text-green-700" },
};

interface Props {
  bottleneck: ClientPerformance["bottleneck"];
}

export default function BottleneckBadge({ bottleneck }: Props) {
  if (!bottleneck) return <span className="text-gray-300">—</span>;
  const { label, description, color } = CONFIG[bottleneck];
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${color}`}
      title={description}
    >
      {label}
    </span>
  );
}
