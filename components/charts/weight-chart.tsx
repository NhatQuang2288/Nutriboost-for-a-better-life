"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeightPoint {
  date: string;
  weightKg: number | null;
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => format(parseISO(d), "dd/MM")}
          tick={{ fontSize: 12 }}
          minTickGap={24}
        />
        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} unit="kg" />
        <Tooltip
          labelFormatter={(d: string) => format(parseISO(d), "dd/MM/yyyy")}
          formatter={(value: number) => [`${value} kg`, "Cân nặng"]}
        />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
