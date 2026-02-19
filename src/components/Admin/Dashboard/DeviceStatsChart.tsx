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
}

export default function DeviceStatsChart({ data, isLoading }: DeviceStatsChartProps) {
  const totalVisitors = React.useMemo(() => {
    return data?.reduce((acc, curr) => acc + curr.count, 0) || 0
  }, [data])

  if (isLoading) {
    return (
      <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
        <CardHeader className="items-center pb-0">
          <Skeleton className="h-6 w-32 bg-white/10 mb-2" />
          <Skeleton className="h-4 w-48 bg-white/10" />
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="relative h-[200px] w-[200px]">
            <Skeleton className="absolute inset-0 rounded-full border-[15px] border-white/5 bg-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Skeleton className="h-8 w-16 bg-white/10" />
              <Skeleton className="h-3 w-12 bg-white/5" />
            </div>
          </div>
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
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-white">Traffic Sources</CardTitle>
          <CardDescription className="text-white/60">Device Breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center pb-0 text-white/40">
          No data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-sm h-full max-h-[400px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-white">Traffic Sources</CardTitle>
        <CardDescription className="text-white/60">Device Breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="bg-zinc-950 border border-zinc-800 text-white shadow-xl"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="device"
              innerRadius={60}
              strokeWidth={5}
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
                          className="fill-white text-3xl font-bold"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-white/60"
                        >
                          Visitors
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
