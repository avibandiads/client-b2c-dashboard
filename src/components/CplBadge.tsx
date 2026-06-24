const CPL_THRESHOLD = 100;

interface Props {
  cpl: number | null;
}

export default function CplBadge({ cpl }: Props) {
  if (cpl === null) {
    return <span className="text-gray-400">—</span>;
  }

  const formatted = `$${cpl.toFixed(2)}`;

  if (cpl > CPL_THRESHOLD) {
    return (
      <span className="inline-block bg-red-100 text-red-700 font-semibold rounded px-2 py-0.5 text-sm">
        {formatted}
      </span>
    );
  }

  return <span className="text-gray-800">{formatted}</span>;
}
