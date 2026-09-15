"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface CaloriePoint {
  date: string;
  consumed: number;
  limit: number;
}

export function CalorieChart({ data }: { data: CaloriePoint[] }) {
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
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip labelFormatter={(d: string) => format(parseISO(d), "dd/MM/yyyy")} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="consumed"
          name="Calo đã nạp"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="limit"
          name="Hạn mức calo"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
