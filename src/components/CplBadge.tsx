interface Props {
  cpl: number | null;
  size?: "sm" | "md";
}

export default function CplBadge({ cpl, size = "sm" }: Props) {
  if (cpl === null) return <span className="text-gray-400">—</span>;

  const formatted = `$${cpl.toFixed(2)}`;
  const base = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  const cls = `inline-block font-semibold rounded ${base}`;

  if (cpl <= 50)  return <span className={`${cls} bg-green-100 text-green-700`}>{formatted}</span>;
  if (cpl <= 100) return <span className={`${cls} bg-yellow-100 text-yellow-700`}>{formatted}</span>;
  return              <span className={`${cls} bg-red-100 text-red-700`}>{formatted}</span>;
}
