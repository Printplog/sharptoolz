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
  revenue: {
    label: "Inflow",
    color: "#10b981", // Emerald
  },
} satisfies ChartConfig

interface WalletFlowChartProps {
  data: Array<{
    date: string
    total_revenue: number
  }> | undefined
  isLoading?: boolean
}

export default function WalletFlowChart({ data, isLoading }: WalletFlowChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full bg-white/5" />
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
    revenue: item.total_revenue,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Wallet Inflow</CardTitle>
        <CardDescription className="text-white/60">
          Total money inflow over the last 30 days
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
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
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
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
