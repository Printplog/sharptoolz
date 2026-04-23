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
import { formatAdminDate } from "@/lib/utils/adminDate"

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
  rangeLabel?: string
}

export default function WalletFlowChart({ data, isLoading, rangeLabel }: WalletFlowChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl animate-pulse">
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-32 bg-white/10 rounded-full" />
        </CardHeader>
        <CardContent className="h-[300px] w-full flex items-end gap-2 px-10 pb-10">
           {Array.from({ length: 15 }).map((_, i) => (
             <Skeleton key={i} className="flex-1 bg-white/5 rounded-t-lg" style={{ height: `${Math.random() * 80 + 10}%` }} />
           ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const chartData = data.map((item) => ({
    date: formatAdminDate(item.date, { month: "short", day: "numeric" }),
    revenue: item.total_revenue,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-emerald-400">Revenue <span className="text-white">Flow</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Performance metrics for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>

        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
           <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                />

              }
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#000" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
