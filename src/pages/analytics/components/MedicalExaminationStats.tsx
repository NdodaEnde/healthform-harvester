
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
import { FileTextIcon, TrendingUpIcon } from "lucide-react";

interface MedicalExaminationStatsProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function MedicalExaminationStats({
  className,
  title = "Medical Examination Statistics",
  description = "Analysis of medical tests conducted and their distribution",
}: MedicalExaminationStatsProps) {
  const [viewType, setViewType] = useState<
    "volume" | "distribution" | "trends"
  >("volume");
  const [timeRange, setTimeRange] = useState("30d");

  // Sample data for medical examinations
  const testVolumeData = [
    { name: "Vision Test", count: 1248, color: "hsl(var(--chart-1))" },
    { name: "Hearing Test", count: 1156, color: "hsl(var(--chart-2))" },
    { name: "Lung Function", count: 987, color: "hsl(var(--chart-3))" },
    { name: "Blood Pressure", count: 876, color: "hsl(var(--chart-4))" },
    { name: "BMI Assessment", count: 754, color: "hsl(var(--chart-5))" },
  ];

  const testDistributionData = [
    { name: "Vision Test", value: 25, color: "hsl(var(--chart-1))" },
    { name: "Hearing Test", value: 23, color: "hsl(var(--chart-2))" },
    { name: "Lung Function", value: 19, color: "hsl(var(--chart-3))" },
    { name: "Blood Pressure", value: 17, color: "hsl(var(--chart-4))" },
    { name: "Other Tests", value: 16, color: "hsl(var(--chart-5))" },
  ];

  const testTrendsData = [
    { month: "Jan", vision: 210, hearing: 190, lung: 170 },
    { month: "Feb", vision: 230, hearing: 200, lung: 180 },
    { month: "Mar", vision: 250, hearing: 220, lung: 190 },
    { month: "Apr", vision: 270, hearing: 240, lung: 210 },
    { month: "May", vision: 290, hearing: 260, lung: 230 },
    { month: "Jun", vision: 310, hearing: 280, lung: 250 },
  ];

  const testCompletionData = [
    { name: "Vision Test", completed: 92, target: 100 },
    { name: "Hearing Test", completed: 88, target: 100 },
    { name: "Lung Function", completed: 85, target: 100 },
    { name: "Blood Pressure", completed: 95, target: 100 },
    { name: "BMI Assessment", completed: 90, target: 100 },
  ];

  const renderVolumeView = () => (
    <div className="space-y-6">
      <ChartContainer config={{}} className="aspect-[none] h-[300px]">
        <BarChart data={testVolumeData}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <Bar dataKey="count" radius={4} barSize={40}>
            {testVolumeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testVolumeData.slice(0, 3).map((test, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                {test.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{test.count}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
                <span>+{5 + index}% from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDistributionView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartContainer config={{}} className="aspect-[none] h-[300px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={testDistributionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {testDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Distribution</h3>
          {testDistributionData.map((entry, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <span className="text-sm font-medium">{entry.value}%</span>
              </div>
              <Progress value={entry.value} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testCompletionData.slice(0, 3).map((test, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{test.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">
                  Completion Rate
                </span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {test.completed}%
                </Badge>
              </div>
              <Progress value={test.completed} className="h-2 mb-2" />
              <div className="text-xs text-muted-foreground">
                Target: {test.target}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTrendsView = () => (
    <div className="space-y-6">
      <ChartContainer config={{}} className="aspect-[none] h-[300px]">
        <BarChart data={testTrendsData}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <Bar
            dataKey="vision"
            fill="hsl(var(--chart-1))"
            radius={4}
            barSize={20}
          />
          <Bar
            dataKey="hearing"
            fill="hsl(var(--chart-2))"
            radius={4}
            barSize={20}
          />
          <Bar
            dataKey="lung"
            fill="hsl(var(--chart-3))"
            radius={4}
            barSize={20}
          />
        </BarChart>
      </ChartContainer>

      <div className="flex items-center justify-center space-x-8">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-1))] mr-2" />
          <span className="text-sm text-muted-foreground">Vision Tests</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-2))] mr-2" />
          <span className="text-sm text-muted-foreground">Hearing Tests</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-3))] mr-2" />
          <span className="text-sm text-muted-foreground">
            Lung Function Tests
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vision Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">310</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              <span>+7% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hearing Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">280</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              <span>+8% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Lung Function Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">250</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUpIcon className="h-3 w-3 mr-1 text-green-500" />
              <span>+9% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
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
      </CardHeader>
      <CardContent>
        <Tabs
          value={viewType}
          onValueChange={(value) =>
            setViewType(value as "volume" | "distribution" | "trends")
          }
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volume">Test Volume</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
        </Tabs>

        {viewType === "volume" && renderVolumeView()}
        {viewType === "distribution" && renderDistributionView()}
        {viewType === "trends" && renderTrendsView()}
      </CardContent>
    </Card>
  );
}
