"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

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
  count: {
    label: "Visitors",
  },
  Mobile: {
    label: "Mobile",
    color: "#22d3ee", // Cyan-400
  },
  Desktop: {
    label: "Desktop",
    color: "#8b5cf6", // Violet-500
  },
  Tablet: {
    label: "Tablet",
    color: "#f59e0b", // Amber-500
  },
} satisfies ChartConfig

interface DeviceStatsChartProps {
  data: Array<{
    device: string
    count: number
  }> | undefined
  isLoading?: boolean
  rangeLabel?: string
}

export default function DeviceStatsChart({ data, isLoading, rangeLabel }: DeviceStatsChartProps) {
  const totalVisitors = React.useMemo(() => {
    return data?.reduce((acc, curr) => acc + curr.count, 0) || 0
  }, [data])

  if (isLoading) {
    return (
      <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-xl animate-pulse h-full">
        <CardHeader className="items-center pb-0">
          <Skeleton className="h-6 w-32 bg-white/10 rounded-full" />
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center h-[300px]">
           <Skeleton className="h-40 w-40 rounded-full border-[10px] border-white/5" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data?.map(item => {
    const config = chartConfig[item.device as keyof typeof chartConfig];
    return {
      ...item,
      fill: (config && 'color' in config ? config.color : undefined) || "#ccc"
    }
  }) || []

  if (!data || data.length === 0 || totalVisitors === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full min-h-[300px] flex flex-col items-center justify-center">
         <p className="text-white/20 uppercase tracking-[0.2em] text-[10px] font-black">No Signal Detected</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1 text-left">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-violet-400">Traffic <span className="text-white">Sources</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Device Distribution for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>

        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
           <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_#8b5cf6]" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="device"
              innerRadius={70}
              outerRadius={90}
              strokeWidth={8}
              stroke="rgba(0,0,0,0.2)"
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-white text-4xl font-black italic tracking-tighter"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-zinc-400 text-[10px] uppercase font-bold tracking-widest"
                        >
                          Total Visits
                        </tspan>

                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

