"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  visits: {
    label: "Total Visits",
    color: "#06b6d4", // Cyan
  },
  unique: {
    label: "Unique Visitors",
    color: "#8b5cf6", // Violet
  },
} satisfies ChartConfig

interface VisitorChartProps {
  data: Array<{
    date: string
    total_visits: number
    unique_visitors: number
  }> | undefined
  isLoading?: boolean
}

export default function VisitorChart({ data, isLoading }: VisitorChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-38 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-56 bg-white/10" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-end gap-1 pt-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 bg-white/5 rounded-t-sm"
                style={{
                  height: `${Math.random() * 70 + 10}%`,
                  opacity: i % 2 === 0 ? 0.3 : 0.1,
                  animationDelay: `${i * 0.03}s`
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8 bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  // Format data
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    visits: item.total_visits,
    unique: item.unique_visitors,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Visitor Traffic</CardTitle>
        <CardDescription className="text-white/60">
          Daily active users and total page views
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visits)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-visits)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillUnique" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-unique)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-unique)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 6)}
              stroke="rgba(255,255,255,0.5)"
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="bg-zinc-950 border border-zinc-800 text-white shadow-xl"
                />
              }
            />
            <Area
              dataKey="visits"
              type="monotone"
              fill="url(#fillVisits)"
              fillOpacity={0.4}
              stroke="var(--color-visits)"
              stackId="a"
            />
            <Area
              dataKey="unique"
              type="monotone"
              fill="url(#fillUnique)"
              fillOpacity={0.4}
              stroke="var(--color-unique)"
              stackId="b"
            />
            {/* Note: stackId 'b' so it doesn't stack on top of 'a', but overlays or separate. 
                If we want them not stacked, remove stackId or use different ones. 
                Total Visits >= Unique. Area chart might hide unique if it's behind.
                Usually better to not stack if comparing sizes directly, or put Unique on top (render second).
                Render order is defined by component order. Unique is second here.
                If visits > unique, visits will cover unique if not transparent.
                But fillOpacity 0.4 handles it.
            */}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
