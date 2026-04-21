"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"

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
    color: "#a855f7", // Purple-500
  },
  unique_visitors: {
    label: "Unique Visitors",
    color: "#22d3ee", // Cyan-400
  },
} satisfies ChartConfig

interface SourceStatsChartProps {
  data: Array<{
    source: string
    visits: number
    unique_visitors: number
  }> | undefined
  rangeLabel?: string
}

export default function SourceStatsChart({ data, rangeLabel }: SourceStatsChartProps) {
  if (!data || data.length === 0) {
    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full flex flex-col items-center justify-center">
            <p className="text-white/20 italic text-sm">No source data available for this range</p>
        </Card>
    );
  }

  // Format data
  const chartData = data.map((item) => ({
    source: item.source === 'referral' ? 'Referral Link' : item.source,
    visits: item.visits,
    unique_visitors: item.unique_visitors,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="text-white">Traffic Sources</CardTitle>
        <CardDescription className="text-white/60">Campaign performance for {rangeLabel?.toLowerCase() || "the selected range"}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20,
            }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.1)" />
            <YAxis
              dataKey="source"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
              width={80}
            />
            <XAxis dataKey="visits" type="number" hide />
            <ChartTooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={
                <ChartTooltipContent
                  indicator="dashed"
                  className="bg-zinc-950 border border-zinc-800 text-white shadow-xl"
                />
              }
            />
            <Legend verticalAlign="top" align="right" height={36}/>
            <Bar dataKey="visits" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="unique_visitors" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
