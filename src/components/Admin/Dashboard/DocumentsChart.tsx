"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  paid: {
    label: "Paid",
    color: "#10b981", // Emerald
  },
  test: {
    label: "Test",
    color: "#f59e0b", // Amber
  },
} satisfies ChartConfig

interface DocumentsChartProps {
  data: Array<{
    date: string
    total: number
    paid: number
    test: number
  }> | undefined
}

export default function DocumentsChart({ data }: DocumentsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle>Document Activity</CardTitle>
          <CardDescription>Last 30 Days</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    )
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    paid: item.paid,
    test: item.test,
  }))

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Document Activity</CardTitle>
        <CardDescription className="text-white/60">
          Showing document creation trends for the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-paid)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-paid)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillTest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-test)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-test)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 6)}
              stroke="rgba(255,255,255,0.5)"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="backdrop-blur-md bg-black/40 border border-white/10 shadow-2xl rounded-lg"
                />
              }
            />
            <Area
              dataKey="test"
              type="natural"
              fill="url(#fillTest)"
              fillOpacity={0.4}
              stroke="var(--color-test)"
              stackId="a"
            />
            <Area
              dataKey="paid"
              type="natural"
              fill="url(#fillPaid)"
              fillOpacity={0.4}
              stroke="var(--color-paid)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none text-white/80">
              Document creation trends{" "}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex items-center gap-2 leading-none text-white/50">
              Paid vs Test documents over time
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
