"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

const chartConfig = {
  visits: {
    label: "Visits",
    color: "#22d3ee", // Cyan-400
  },
} satisfies ChartConfig

interface TopPagesChartProps {
  data: Array<{
    path: string
    visits: number
  }> | undefined
}

export default function TopPagesChart({ data }: TopPagesChartProps) {
  if (!data || data.length === 0) return null

  // Format data
  const chartData = data.map((item) => ({
    page: item.path,
    visits: item.visits,
    fill: "var(--color-visits)",
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Top Pages</CardTitle>
        <CardDescription className="text-white/60">Most visited paths</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.1)" />
            <YAxis
              dataKey="page"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.length > 20 ? value.slice(0, 20) + '...' : value}
              hide
            />
            <XAxis dataKey="visits" type="number" hide />
            <ChartTooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-zinc-950 border border-zinc-800 text-white shadow-xl"
                />
              }
            />
            <Bar dataKey="visits" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
