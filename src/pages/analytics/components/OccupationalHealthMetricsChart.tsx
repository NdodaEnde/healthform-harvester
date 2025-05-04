
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

interface OccupationalHealthMetricsChartProps {
  title?: string;
  description?: string;
  className?: string;
  metricType?: "vision" | "hearing" | "lung" | "overall";
}

export default function OccupationalHealthMetricsChart({
  title = "Occupational Health Metrics",
  description = "Employee health assessment results",
  className,
  metricType = "vision",
}: OccupationalHealthMetricsChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [timeRange, setTimeRange] = useState("1y");
  const [metric, setMetric] = useState(getDefaultMetric(metricType));

  // Sample data for different metrics
  const visionData = [
    { month: "Jan", nearVision: 92, farVision: 88, depthPerception: 95 },
    { month: "Feb", nearVision: 91, farVision: 87, depthPerception: 94 },
    { month: "Mar", nearVision: 93, farVision: 89, depthPerception: 96 },
    { month: "Apr", nearVision: 90, farVision: 86, depthPerception: 93 },
    { month: "May", nearVision: 94, farVision: 90, depthPerception: 97 },
    { month: "Jun", nearVision: 92, farVision: 88, depthPerception: 95 },
  ];

  const hearingData = [
    { month: "Jan", leftEar: 85, rightEar: 87, noiseExposure: 12 },
    { month: "Feb", leftEar: 84, rightEar: 86, noiseExposure: 14 },
    { month: "Mar", leftEar: 86, rightEar: 88, noiseExposure: 11 },
    { month: "Apr", leftEar: 83, rightEar: 85, noiseExposure: 15 },
    { month: "May", leftEar: 87, rightEar: 89, noiseExposure: 10 },
    { month: "Jun", leftEar: 85, rightEar: 87, noiseExposure: 13 },
  ];

  const lungData = [
    { month: "Jan", fvc: 92, fev1: 88, ratio: 95 },
    { month: "Feb", fvc: 91, fev1: 87, ratio: 94 },
    { month: "Mar", fvc: 93, fev1: 89, ratio: 96 },
    { month: "Apr", fvc: 90, fev1: 86, ratio: 93 },
    { month: "May", fvc: 94, fev1: 90, ratio: 97 },
    { month: "Jun", fvc: 92, fev1: 88, ratio: 95 },
  ];

  const fitnessStatusData = [
    { name: "Fit", value: 65, color: "hsl(var(--chart-1))" },
    { name: "Fit with Restriction", value: 20, color: "hsl(var(--chart-2))" },
    { name: "Fit with Condition", value: 10, color: "hsl(var(--chart-3))" },
    { name: "Temporary Unfit", value: 3, color: "hsl(var(--chart-4))" },
    { name: "Unfit", value: 2, color: "hsl(var(--chart-5))" },
  ];

  function getDefaultMetric(type: string): string {
    switch (type) {
      case "vision":
        return "near-far-vision";
      case "hearing":
        return "hearing-levels";
      case "lung":
        return "lung-function";
      case "overall":
        return "fitness-status";
      default:
        return "near-far-vision";
    }
  }

  function getChartData() {
    switch (metricType) {
      case "vision":
        return visionData;
      case "hearing":
        return hearingData;
      case "lung":
        return lungData;
      case "overall":
        return fitnessStatusData;
      default:
        return visionData;
    }
  }

  function renderMetricOptions() {
    switch (metricType) {
      case "vision":
        return (
          <>
            <SelectItem value="near-far-vision">
              Near & Far Vision
            </SelectItem>
            <SelectItem value="depth-perception">
              Depth Perception
            </SelectItem>
            <SelectItem value="night-vision">
              Night Vision
            </SelectItem>
            <SelectItem value="color-vision">
              Color Vision
            </SelectItem>
          </>
        );

      case "hearing":
        return (
          <>
            <SelectItem value="hearing-levels">
              Hearing Levels
            </SelectItem>
            <SelectItem value="noise-exposure">
              Noise Exposure
            </SelectItem>
            <SelectItem value="hearing-protection">
              Hearing Protection Usage
            </SelectItem>
          </>
        );

      case "lung":
        return (
          <>
            <SelectItem value="lung-function">
              Lung Function
            </SelectItem>
            <SelectItem value="dust-exposure">
              Dust Exposure
            </SelectItem>
            <SelectItem value="respiratory-protection">
              Respiratory Protection
            </SelectItem>
          </>
        );

      case "overall":
        return (
          <>
            <SelectItem value="fitness-status">
              Fitness Status
            </SelectItem>
            <SelectItem value="restrictions">
              Restrictions
            </SelectItem>
            <SelectItem value="compliance">
              Compliance Rate
            </SelectItem>
          </>
        );

      default:
        return null;
    }
  }

  function renderChart() {
    if (metricType === "overall" && metric === "fitness-status") {
      return (
        <ChartContainer
          config={{
            1: { theme: { light: "hsl(var(--chart-1))", dark: "hsl(var(--chart-1))" } },
            2: { theme: { light: "hsl(var(--chart-2))", dark: "hsl(var(--chart-2))" } },
            3: { theme: { light: "hsl(var(--chart-3))", dark: "hsl(var(--chart-3))" } },
            4: { theme: { light: "hsl(var(--chart-4))", dark: "hsl(var(--chart-4))" } },
            5: { theme: { light: "hsl(var(--chart-5))", dark: "hsl(var(--chart-5))" } },
          }}
          className="aspect-[none] h-[350px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={fitnessStatusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {fitnessStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ChartContainer
          config={{
            1: { theme: { light: "hsl(var(--chart-1))", dark: "hsl(var(--chart-1))" } },
            2: { theme: { light: "hsl(var(--chart-2))", dark: "hsl(var(--chart-2))" } },
            3: { theme: { light: "hsl(var(--chart-3))", dark: "hsl(var(--chart-3))" } },
          }}
          className="aspect-[none] h-[350px]"
        >
          <LineChart data={getChartData()}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />

            {metricType === "vision" && metric === "near-far-vision" && (
              <>
                <Line
                  type="monotone"
                  dataKey="nearVision"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="farVision"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}

            {metricType === "vision" && metric === "depth-perception" && (
              <Line
                type="monotone"
                dataKey="depthPerception"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}

            {metricType === "hearing" && metric === "hearing-levels" && (
              <>
                <Line
                  type="monotone"
                  dataKey="leftEar"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="rightEar"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}

            {metricType === "hearing" && metric === "noise-exposure" && (
              <Line
                type="monotone"
                dataKey="noiseExposure"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}

            {metricType === "lung" && metric === "lung-function" && (
              <>
                <Line
                  type="monotone"
                  dataKey="fvc"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="fev1"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="ratio"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </>
            )}
          </LineChart>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer
        config={{
          1: { theme: { light: "hsl(var(--chart-1))", dark: "hsl(var(--chart-1))" } },
          2: { theme: { light: "hsl(var(--chart-2))", dark: "hsl(var(--chart-2))" } },
          3: { theme: { light: "hsl(var(--chart-3))", dark: "hsl(var(--chart-3))" } },
        }}
        className="aspect-[none] h-[350px]"
      >
        <BarChart data={getChartData()}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />

          {metricType === "vision" && metric === "near-far-vision" && (
            <>
              <Bar
                dataKey="nearVision"
                fill="hsl(var(--chart-1))"
                radius={4}
                barSize={20}
              />

              <Bar
                dataKey="farVision"
                fill="hsl(var(--chart-2))"
                radius={4}
                barSize={20}
              />
            </>
          )}

          {metricType === "vision" && metric === "depth-perception" && (
            <Bar
              dataKey="depthPerception"
              fill="hsl(var(--chart-1))"
              radius={4}
              barSize={20}
            />
          )}

          {metricType === "hearing" && metric === "hearing-levels" && (
            <>
              <Bar
                dataKey="leftEar"
                fill="hsl(var(--chart-1))"
                radius={4}
                barSize={20}
              />

              <Bar
                dataKey="rightEar"
                fill="hsl(var(--chart-2))"
                radius={4}
                barSize={20}
              />
            </>
          )}

          {metricType === "hearing" && metric === "noise-exposure" && (
            <Bar
              dataKey="noiseExposure"
              fill="hsl(var(--chart-1))"
              radius={4}
              barSize={20}
            />
          )}

          {metricType === "lung" && metric === "lung-function" && (
            <>
              <Bar
                dataKey="fvc"
                fill="hsl(var(--chart-1))"
                radius={4}
                barSize={20}
              />

              <Bar
                dataKey="fev1"
                fill="hsl(var(--chart-2))"
                radius={4}
                barSize={20}
              />

              <Bar
                dataKey="ratio"
                fill="hsl(var(--chart-3))"
                radius={4}
                barSize={20}
              />
            </>
          )}
        </BarChart>
      </ChartContainer>
    );
  }

  function renderLegend() {
    if (metricType === "overall" && metric === "fitness-status") {
      return (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {fitnessStatusData.map((entry, index) => (
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
      );
    }

    if (
      (metricType === "vision" && metric === "near-far-vision") ||
      (metricType === "hearing" && metric === "hearing-levels") ||
      (metricType === "lung" && metric === "lung-function")
    ) {
      return (
        <div className="mt-4 flex items-center justify-center space-x-8">
          {metricType === "vision" && (
            <>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="text-sm text-muted-foreground">
                  Near Vision
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="text-sm text-muted-foreground">
                  Far Vision
                </span>
              </div>
            </>
          )}

          {metricType === "hearing" && (
            <>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="text-sm text-muted-foreground">
                  Left Ear
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="text-sm text-muted-foreground">
                  Right Ear
                </span>
              </div>
            </>
          )}

          {metricType === "lung" && (
            <>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-1))]" />
                <span className="text-sm text-muted-foreground">
                  FVC
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-2))]" />
                <span className="text-sm text-muted-foreground">
                  FEV1
                </span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-[hsl(var(--chart-3))]" />
                <span className="text-sm text-muted-foreground">
                  FEV1/FVC Ratio
                </span>
              </div>
            </>
          )}
        </div>
      );
    }

    return null;
  }

  function getMetricTitle() {
    switch (metric) {
      case "near-far-vision":
        return "Near & Far Vision Assessment (%)";
      case "depth-perception":
        return "Depth Perception Assessment (%)";
      case "night-vision":
        return "Night Vision Assessment (%)";
      case "color-vision":
        return "Color Vision Assessment (%)";
      case "hearing-levels":
        return "Hearing Levels Assessment (%)";
      case "noise-exposure":
        return "Noise Exposure Levels (dB)";
      case "hearing-protection":
        return "Hearing Protection Usage (%)";
      case "lung-function":
        return "Lung Function Assessment (%)";
      case "dust-exposure":
        return "Dust Exposure Levels";
      case "respiratory-protection":
        return "Respiratory Protection Usage (%)";
      case "fitness-status":
        return "Employee Fitness Status Distribution";
      case "restrictions":
        return "Workplace Restrictions Distribution";
      case "compliance":
        return "Health Assessment Compliance Rate (%)";
      default:
        return title;
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle>
            {getMetricTitle()}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {metricType !== "overall" && (
            <Tabs
              defaultValue="line"
              value={chartType}
              onValueChange={(value) => setChartType(value as "line" | "bar")}
            >
              <TabsList className="grid w-[120px] grid-cols-2">
                <TabsTrigger value="line" className="w-min h-5 -mt-0.5 px-2">
                  Line
                </TabsTrigger>
                <TabsTrigger value="bar" className="w-min h-5 -mt-0.5 px-2">
                  Bar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="2y">Last 2 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {renderMetricOptions()}
            </SelectContent>
          </Select>
        </div>
        {renderChart()}
        {renderLegend()}
      </CardContent>
    </Card>
  );
}
