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
  users: {
    label: "Total Users",
    color: "#a855f7", // Purple-500
  },
} satisfies ChartConfig

interface UserGrowthChartProps {
  data: Array<{
    date: string
    users: number
  }> | undefined
  isLoading?: boolean
}

export default function UserGrowthChart({ data, isLoading }: UserGrowthChartProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full flex items-end gap-1 pt-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 bg-white/5 rounded-t-sm"
                style={{
                  height: `${20 + (i * 3.5)}%`,
                  opacity: 0.1 + (i * 0.02)
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-12 bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
        <CardHeader>
          <CardTitle className="text-white">User Growth</CardTitle>
          <CardDescription className="text-white/60">Total Registered Users</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-white/40">
          No data available
        </CardContent>
      </Card>
    )
  }

  // Format data
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    users: item.users,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
      <CardHeader>
        <CardTitle className="text-white">User Growth</CardTitle>
        <CardDescription className="text-white/60">
          Cumulative registration trend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[310px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 0,
              top: 10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-users)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
              stroke="rgba(255,255,255,0.4)"
            />
            <ChartTooltip
              cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="bg-zinc-950 border border-zinc-800 text-white shadow-xl"
                />
              }
            />
            <Area
              dataKey="users"
              type="natural"
              fill="url(#fillUsers)"
              fillOpacity={0.4}
              stroke="var(--color-users)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
