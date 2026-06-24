"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DailyDataPoint } from "@/lib/types";

interface Props {
  data: DailyDataPoint[];
  metric: "leads" | "appointments" | "cpl" | "cpa";
  label: string;
  color: string;
}

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${parseInt(m)}/${parseInt(day)}`;
}

function formatValue(value: number, metric: Props["metric"]) {
  if (metric === "cpl" || metric === "cpa") return `$${value.toFixed(2)}`;
  return String(value);
}

export default function TrendChart({ data, metric, label, color }: Props) {
  const chartData = data.map((d) => ({
    date: formatDate(d.date),
    value: d[metric] ?? 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => (metric === "cpl" || metric === "cpa") ? `$${v}` : String(v)}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value: unknown) => [formatValue(Number(value), metric), label]}
            labelStyle={{ color: "#6b7280" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
