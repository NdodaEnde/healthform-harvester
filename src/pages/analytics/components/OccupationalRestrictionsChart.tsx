
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";

interface OccupationalRestrictionsChartProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function OccupationalRestrictionsChart({
  title = "Workplace Restrictions Analysis",
  description = "Distribution of workplace restrictions from health assessments",
  className,
}: OccupationalRestrictionsChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [department, setDepartment] = useState("all");

  // Sample data for restrictions
  const restrictionsData = [
    { name: "Heights", value: 28, color: "hsl(var(--chart-1))" },
    { name: "Dust Exposure", value: 22, color: "hsl(var(--chart-2))" },
    { name: "Chemical Exposure", value: 17, color: "hsl(var(--chart-3))" },
    { name: "Confined Spaces", value: 15, color: "hsl(var(--chart-4))" },
    { name: "Motorized Equipment", value: 12, color: "hsl(var(--chart-5))" },
    { name: "Other", value: 6, color: "hsl(var(--chart-1))" },
  ];

  // Sample data for protection requirements
  const protectionData = [
    { name: "Hearing Protection", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Wear Spectacles", value: 32, color: "hsl(var(--chart-2))" },
    { name: "Dust Protection", value: 28, color: "hsl(var(--chart-3))" },
    {
      name: "Chronic Condition Treatment",
      value: 18,
      color: "hsl(var(--chart-4))",
    },
    { name: "Other", value: 7, color: "hsl(var(--chart-5))" },
  ];

  // Choose which dataset to display
  const chartData =
    department === "protection" ? protectionData : restrictionsData;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Workplace Restrictions</SelectItem>
              <SelectItem value="protection">Protection Requirements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === "pie"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === "bar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Bar
            </button>
          </div>
        </div>

        {chartType === "pie" ? (
          <ChartContainer config={{}} className="aspect-[none] h-[350px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={{}} className="aspect-[none] h-[350px]">
            <BarChart data={chartData}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
              />

              <Bar
                dataKey="value"
                fill="hsl(var(--chart-1))"
                radius={4}
                barSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {chartData.map((entry, index) => (
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
  );
}
