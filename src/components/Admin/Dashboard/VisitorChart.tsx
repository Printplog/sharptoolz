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
  rangeLabel?: string
}

export default function VisitorChart({ data, isLoading, rangeLabel }: VisitorChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl animate-pulse">
        <CardHeader className="gap-2">
          <Skeleton className="h-6 w-32 bg-white/10 rounded-full" />
          <Skeleton className="h-4 w-52 bg-white/5 rounded-full" />
        </CardHeader>
        <CardContent className="h-[300px] w-full flex items-end gap-2 px-10 pb-10">
           {Array.from({ length: 20 }).map((_, i) => (
             <Skeleton key={i} className="flex-1 bg-white/5 rounded-t-lg" style={{ height: `${Math.random() * 80 + 10}%` }} />
           ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  const chartData = data.map((item) => ({
    date: formatAdminDate(item.date, { month: "short", day: "numeric" }),
    visits: item.total_visits,
    unique: item.unique_visitors,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-cyan-400">Visitor <span className="text-white">Traffic</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Telemetry for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
           <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillUnique" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
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
              dataKey="visits"
              type="natural"
              fill="url(#fillVisits)"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, fill: "#06b6d4", strokeWidth: 2, stroke: "#000" }}
            />
            <Area
              dataKey="unique"
              type="natural"
              fill="url(#fillUnique)"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#000" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

