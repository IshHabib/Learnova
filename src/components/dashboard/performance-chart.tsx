
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface PerformanceChartProps {
  data?: { name: string; score: number; average?: number }[]
}

const defaultChartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
  average: {
    label: "Class Avg",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Use provided data or an empty array if loading/missing
  const displayData = data && data.length > 0 ? data : []

  return (
    <div className="h-[350px] w-full">
      {displayData.length === 0 ? (
        <div className="flex h-full items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">No performance data available yet.</p>
        </div>
      ) : (
        <ChartContainer config={defaultChartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {displayData[0]?.average !== undefined && (
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="var(--color-average)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  )
}
