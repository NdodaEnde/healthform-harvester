
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  EyeIcon,
  HeartIcon,
} from "lucide-react";

interface FitnessCertificateStatsProps {
  className?: string;
}

export default function FitnessCertificateStats({
  className,
}: FitnessCertificateStatsProps) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  // Sample data for certificate statistics
  const certificateStats = {
    month: {
      total: 245,
      fit: 158,
      fitWithRestriction: 52,
      fitWithCondition: 25,
      temporaryUnfit: 7,
      unfit: 3,
      completionRate: 92,
      expiringCertificates: 18,
    },
    quarter: {
      total: 720,
      fit: 468,
      fitWithRestriction: 151,
      fitWithCondition: 72,
      temporaryUnfit: 22,
      unfit: 7,
      completionRate: 88,
      expiringCertificates: 54,
    },
    year: {
      total: 2850,
      fit: 1853,
      fitWithRestriction: 598,
      fitWithCondition: 285,
      temporaryUnfit: 85,
      unfit: 29,
      completionRate: 95,
      expiringCertificates: 210,
    },
  };

  const currentStats = certificateStats[period];

  // Calculate percentages
  const fitPercent = Math.round((currentStats.fit / currentStats.total) * 100);
  const fitWithRestrictionPercent = Math.round(
    (currentStats.fitWithRestriction / currentStats.total) * 100,
  );
  const fitWithConditionPercent = Math.round(
    (currentStats.fitWithCondition / currentStats.total) * 100,
  );
  const temporaryUnfitPercent = Math.round(
    (currentStats.temporaryUnfit / currentStats.total) * 100,
  );
  const unfitPercent = Math.round(
    (currentStats.unfit / currentStats.total) * 100,
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          Certificate of Fitness Statistics
        </CardTitle>
        <Tabs
          value={period}
          onValueChange={(value) =>
            setPeriod(value as "month" | "quarter" | "year")
          }
        >
          <TabsList className="grid w-[250px] grid-cols-3">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Certificate Status Distribution</h3>
                <span className="text-sm text-muted-foreground">
                  Total: {currentStats.total}
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Fit</span>
                    </div>
                    <span>
                      {currentStats.fit} ({fitPercent}%)
                    </span>
                  </div>
                  <Progress
                    value={fitPercent}
                    className="h-2 bg-muted [&>div]:bg-green-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span>Fit with Restriction</span>
                    </div>
                    <span>
                      {currentStats.fitWithRestriction} (
                      {fitWithRestrictionPercent}%)
                    </span>
                  </div>
                  <Progress
                    value={fitWithRestrictionPercent}
                    className="h-2 bg-muted [&>div]:bg-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <span>Fit with Condition</span>
                    </div>
                    <span>
                      {currentStats.fitWithCondition} ({fitWithConditionPercent}
                      %)
                    </span>
                  </div>
                  <Progress
                    value={fitWithConditionPercent}
                    className="h-2 bg-muted [&>div]:bg-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                      <span>Temporary Unfit</span>
                    </div>
                    <span>
                      {currentStats.temporaryUnfit} ({temporaryUnfitPercent}%)
                    </span>
                  </div>
                  <Progress
                    value={temporaryUnfitPercent}
                    className="h-2 bg-muted [&>div]:bg-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span>Unfit</span>
                    </div>
                    <span>
                      {currentStats.unfit} ({unfitPercent}%)
                    </span>
                  </div>
                  <Progress
                    value={unfitPercent}
                    className="h-2 bg-muted [&>div]:bg-red-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Completion Rate</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <Progress
                    value={currentStats.completionRate}
                    className="h-3 bg-muted [&>div]:bg-blue-500"
                  />
                </div>
                <span className="ml-2 font-medium">
                  {currentStats.completionRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <ClipboardListIcon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total Certificates</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {currentStats.total}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Expiring Soon</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {currentStats.expiringCertificates}
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-medium mb-3">Common Restrictions</h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Heights
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Dust Exposure
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Chemical Exposure
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Confined Spaces
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Motorized Equipment
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3">Required Protections</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Wear Spectacles: 32%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HeartIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Chronic Conditions: 18%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Hearing Protection: 45%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Dust Protection: 28%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
