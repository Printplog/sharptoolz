"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

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
}

export default function DistributionChart({ data }: DistributionChartProps) {
  const chartData = React.useMemo(() => {
    if (!data) return []
    
    // Aggregate data
    const totalPaid = data.reduce((acc, item) => acc + item.paid, 0)
    const totalTest = data.reduce((acc, item) => acc + item.test, 0)
    
    return [
      { type: "paid", count: totalPaid, fill: "var(--color-paid)" },
      { type: "test", count: totalTest, fill: "var(--color-test)" },
    ]
  }, [data])

  const totalDocuments = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card className="flex flex-col bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-white">Document Types</CardTitle>
        <CardDescription className="text-white/60">Distribution of Paid vs Test Documents</CardDescription>
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
              nameKey="type"
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
                          {totalDocuments.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-white/60 text-xs"
                        >
                          Documents
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
      <CardFooter className="flex-col gap-2 text-sm text-white/50">
        <div className="flex items-center gap-2 font-medium leading-none text-white/80">
          Showing total distribution <span className="text-emerald-400">Paid</span> vs <span className="text-amber-400">Test</span>
        </div>
      </CardFooter>
    </Card>
  )
}
