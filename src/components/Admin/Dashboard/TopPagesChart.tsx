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
    color: "#06b6d4", // Cyan-400
  },
} satisfies ChartConfig

interface TopPagesChartProps {
  data: Array<{
    path: string
    visits: number
  }> | undefined
  rangeLabel?: string
}

export default function TopPagesChart({ data, rangeLabel }: TopPagesChartProps) {
  if (!data || data.length === 0) return null

  const chartData = data.map((item) => ({
    page: item.path,
    visits: item.visits,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl h-fit">

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-cyan-400">Page <span className="text-white">Traffic</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Most visited paths for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>

        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
           <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
           config={chartConfig} 
           className="h-[300px] w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-white/5"
        >

          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 20 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <YAxis
              dataKey="page"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'black' }}
              width={140}

              tickFormatter={(value) => value.length > 18 ? value.slice(0, 15) + '...' : value}
            />
            <XAxis dataKey="visits" type="number" hide />
            <ChartTooltip
              cursor={{ 
                fill: 'rgba(6, 182, 212, 0.08)',
                radius: 4
              }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                />
              }
            />


            <Bar dataKey="visits" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
