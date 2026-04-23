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
    label: "Documents",
  },
  paid: {
    label: "Paid",
    color: "#10b981", // Emerald
  },
  test: {
    label: "Test",
    color: "#f59e0b", // Amber
  },
} satisfies ChartConfig

interface DistributionChartProps {
  data: Array<{
    date: string
    total: number
    paid: number
    test: number
  }> | undefined
  isLoading?: boolean
}

export default function DistributionChart({ data, isLoading }: DistributionChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return []

    const totalPaid = data.reduce((acc, item) => acc + item.paid, 0)
    const totalTest = data.reduce((acc, item) => acc + item.test, 0)

    return [
      { type: "paid", count: totalPaid, fill: "#10b981" },
      { type: "test", count: totalTest, fill: "#f59e0b" },
    ]
  }, [data])

  const totalDocuments = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

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

  if (!data || data.length === 0) return null

  return (
    <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-emerald-400">Document <span className="text-white">Types</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Distribution of Paid vs Test Documents
          </CardDescription>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
           <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
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
                  className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
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
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-white text-4xl font-black italic tracking-tighter"
                        >
                          {totalDocuments.toLocaleString()}
                        </text>
                        <text
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-zinc-400 text-[10px] uppercase font-bold tracking-widest"
                        >
                          Docs Total
                        </text>
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
