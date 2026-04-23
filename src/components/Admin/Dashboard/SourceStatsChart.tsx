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
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full min-h-[300px] flex flex-col items-center justify-center">
         <p className="text-white/20 uppercase tracking-[0.2em] text-[10px] font-black">No Campaign Signal</p>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    source: item.source === 'referral' ? 'Referer' : item.source,
    visits: item.visits,
    unique_visitors: item.unique_visitors,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/[0.07] transition-all duration-300 shadow-2xl h-fit">

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-amber-400">Traffic <span className="text-white">Sources</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Source Attribution for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
           <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer 
           config={chartConfig} 
           className="h-[300px] w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-amber-500/10"
        >

          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 30, right: 20 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
            <YAxis
              dataKey="source"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 'black' }}

              width={100}

            />
            <XAxis dataKey="visits" type="number" hide />
            <ChartTooltip
              cursor={{ fill: 'rgba(251, 191, 36, 0.05)', radius: 4 }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                />
              }
            />

            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
            <Bar dataKey="visits" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="unique_visitors" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

