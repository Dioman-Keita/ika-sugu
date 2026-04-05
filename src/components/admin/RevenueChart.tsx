"use client";

import { formatMoney } from "@/lib/currency/shared";
import type { Locale } from "@/lib/i18n/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data: { month: string; revenue: number }[];
  currency: string;
  locale: Locale;
  revenueLabel: string;
};

export default function RevenueChart({
  data,
  currency,
  locale,
  revenueLabel,
}: Props) {
  const tickFormatter = (value: number) => {
    const compact = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);

    return formatMoney(Number.isFinite(value) ? value : 0, currency, locale).replace(
      /[\d\s.,]+/,
      compact,
    );
  };

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={tickFormatter}
          width={48}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", radius: 6 }}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 13,
            color: "hsl(var(--foreground))",
          }}
          formatter={(value) => [
            formatMoney(Number(value ?? 0), currency, locale),
            revenueLabel,
          ]}
        />
        <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
