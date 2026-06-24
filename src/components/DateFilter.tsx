interface Props {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last_7d" },
  { label: "Last 14 Days", value: "last_14d" },
  { label: "Last 30 Days", value: "last_30d" },
];

export default function DateFilter({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-800 border border-slate-600 text-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-slate-800">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
