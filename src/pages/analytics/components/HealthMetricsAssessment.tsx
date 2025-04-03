
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HealthMetricsAssessment() {
  const [timeRange, setTimeRange] = useState("30d");

  // Chart colors config
  const chartConfig = {
    1: { theme: { light: "hsl(var(--chart-1))", dark: "hsl(var(--chart-1))" } },
    2: { theme: { light: "hsl(var(--chart-2))", dark: "hsl(var(--chart-2))" } },
    3: { theme: { light: "hsl(var(--chart-3))", dark: "hsl(var(--chart-3))" } },
    4: { theme: { light: "hsl(var(--chart-4))", dark: "hsl(var(--chart-4))" } },
    5: { theme: { light: "hsl(var(--chart-5))", dark: "hsl(var(--chart-5))" } },
    6: { theme: { light: "hsl(var(--chart-6))", dark: "hsl(var(--chart-6))" } },
  };

  // Vision Assessment data
  const visionData = [
    { name: "Normal", value: 68, color: "hsl(var(--chart-1))" },
    { name: "Corrected", value: 24, color: "hsl(var(--chart-2))" },
    { name: "Borderline", value: 6, color: "hsl(var(--chart-3))" },
    { name: "Impaired", value: 2, color: "hsl(var(--chart-4))" },
  ];

  const visionTrendsData = [
    { month: "Jan", normal: 65, corrected: 26, borderline: 7, impaired: 2 },
    { month: "Feb", normal: 66, corrected: 25, borderline: 7, impaired: 2 },
    { month: "Mar", normal: 67, corrected: 24, borderline: 7, impaired: 2 },
    { month: "Apr", normal: 68, corrected: 24, borderline: 6, impaired: 2 },
    { month: "May", normal: 68, corrected: 24, borderline: 6, impaired: 2 },
    { month: "Jun", normal: 69, corrected: 23, borderline: 6, impaired: 2 },
  ];

  // Hearing Assessment data
  const hearingData = [
    { name: "Normal", value: 72, color: "hsl(var(--chart-1))" },
    { name: "Mild Loss", value: 18, color: "hsl(var(--chart-2))" },
    { name: "Moderate Loss", value: 8, color: "hsl(var(--chart-3))" },
    { name: "Severe Loss", value: 2, color: "hsl(var(--chart-4))" },
  ];

  const hearingTrendsData = [
    { month: "Jan", normal: 70, mild: 19, moderate: 9, severe: 2 },
    { month: "Feb", normal: 71, mild: 18, moderate: 9, severe: 2 },
    { month: "Mar", normal: 71, mild: 18, moderate: 9, severe: 2 },
    { month: "Apr", normal: 72, mild: 18, moderate: 8, severe: 2 },
    { month: "May", normal: 72, mild: 18, moderate: 8, severe: 2 },
    { month: "Jun", normal: 73, mild: 17, moderate: 8, severe: 2 },
  ];

  // Lung Function data
  const lungData = [
    { name: "Normal", value: 76, color: "hsl(var(--chart-1))" },
    { name: "Mild Restriction", value: 14, color: "hsl(var(--chart-2))" },
    { name: "Moderate Restriction", value: 8, color: "hsl(var(--chart-3))" },
    { name: "Severe Restriction", value: 2, color: "hsl(var(--chart-4))" },
  ];

  const lungTrendsData = [
    { month: "Jan", normal: 74, mild: 15, moderate: 9, severe: 2 },
    { month: "Feb", normal: 75, mild: 14, moderate: 9, severe: 2 },
    { month: "Mar", normal: 75, mild: 14, moderate: 9, severe: 2 },
    { month: "Apr", normal: 76, mild: 14, moderate: 8, severe: 2 },
    { month: "May", normal: 76, mild: 14, moderate: 8, severe: 2 },
    { month: "Jun", normal: 77, mild: 13, moderate: 8, severe: 2 },
  ];

  // Overall Fitness data
  const fitnessData = [
    { name: "Fit for All Work", value: 75, color: "hsl(var(--chart-1))" },
    { name: "Fit with Restrictions", value: 20, color: "hsl(var(--chart-2))" },
    { name: "Temporarily Unfit", value: 4, color: "hsl(var(--chart-3))" },
    { name: "Unfit for Role", value: 1, color: "hsl(var(--chart-4))" },
  ];

  const fitnessTrendsData = [
    { month: "Jan", fitAll: 73, fitRestricted: 21, tempUnfit: 5, unfit: 1 },
    { month: "Feb", fitAll: 74, fitRestricted: 20, tempUnfit: 5, unfit: 1 },
    { month: "Mar", fitAll: 74, fitRestricted: 20, tempUnfit: 5, unfit: 1 },
    { month: "Apr", fitAll: 75, fitRestricted: 20, tempUnfit: 4, unfit: 1 },
    { month: "May", fitAll: 75, fitRestricted: 20, tempUnfit: 4, unfit: 1 },
    { month: "Jun", fitAll: 76, fitRestricted: 19, tempUnfit: 4, unfit: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Health Metrics Analysis</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vision Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Vision Assessment</CardTitle>
          <CardDescription>
            Distribution of vision assessment results across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={visionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {visionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
            
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={visionTrendsData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="normal"
                  stroke="hsl(var(--chart-1))"
                  name="Normal"
                />
                <Line
                  type="monotone"
                  dataKey="corrected"
                  stroke="hsl(var(--chart-2))"
                  name="Corrected"
                />
                <Line
                  type="monotone"
                  dataKey="borderline"
                  stroke="hsl(var(--chart-3))"
                  name="Borderline"
                />
                <Line
                  type="monotone"
                  dataKey="impaired"
                  stroke="hsl(var(--chart-4))"
                  name="Impaired"
                />
                <Legend />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hearing Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Hearing Assessment</CardTitle>
          <CardDescription>
            Distribution of hearing assessment results across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={hearingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {hearingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
            
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={hearingTrendsData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="normal"
                  stroke="hsl(var(--chart-1))"
                  name="Normal"
                />
                <Line
                  type="monotone"
                  dataKey="mild"
                  stroke="hsl(var(--chart-2))"
                  name="Mild Loss"
                />
                <Line
                  type="monotone"
                  dataKey="moderate"
                  stroke="hsl(var(--chart-3))"
                  name="Moderate Loss"
                />
                <Line
                  type="monotone"
                  dataKey="severe"
                  stroke="hsl(var(--chart-4))"
                  name="Severe Loss"
                />
                <Legend />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Lung Function Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Lung Function Assessment</CardTitle>
          <CardDescription>
            Distribution of lung function assessment results across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={lungData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {lungData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
            
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={lungTrendsData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="normal"
                  stroke="hsl(var(--chart-1))"
                  name="Normal"
                />
                <Line
                  type="monotone"
                  dataKey="mild"
                  stroke="hsl(var(--chart-2))"
                  name="Mild Restriction"
                />
                <Line
                  type="monotone"
                  dataKey="moderate"
                  stroke="hsl(var(--chart-3))"
                  name="Moderate Restriction"
                />
                <Line
                  type="monotone"
                  dataKey="severe"
                  stroke="hsl(var(--chart-4))"
                  name="Severe Restriction"
                />
                <Legend />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overall Fitness Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Fitness Status</CardTitle>
          <CardDescription>
            Distribution of overall fitness status across the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={fitnessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {fitnessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartContainer>
            
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={fitnessTrendsData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Line
                  type="monotone"
                  dataKey="fitAll"
                  stroke="hsl(var(--chart-1))"
                  name="Fit for All Work"
                />
                <Line
                  type="monotone"
                  dataKey="fitRestricted"
                  stroke="hsl(var(--chart-2))"
                  name="Fit with Restrictions"
                />
                <Line
                  type="monotone"
                  dataKey="tempUnfit"
                  stroke="hsl(var(--chart-3))"
                  name="Temporarily Unfit"
                />
                <Line
                  type="monotone"
                  dataKey="unfit"
                  stroke="hsl(var(--chart-4))"
                  name="Unfit for Role"
                />
                <Legend />
              </LineChart>
            </ChartContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {fitnessData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm">
                  {entry.name}: {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
