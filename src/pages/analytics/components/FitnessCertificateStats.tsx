import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  EyeIcon,
  HeartIcon,
} from "lucide-react";
import FitnessStatusBarChart from "@/components/analytics/FitnessStatusBarChart";

interface FitnessCertificateStatsProps {
  className?: string;
}

export default function FitnessCertificateStats({
  className,
}: FitnessCertificateStatsProps) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch medical examinations data
  const { data: examinationsData, isLoading } = useQuery({
    queryKey: ['examinations-stats', organizationId, period],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      
      // Calculate date range based on period
      switch (period) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('medical_examinations')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('examination_date', startDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      console.log('Examinations data:', data);
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Process data to calculate statistics
  const certificateStats = React.useMemo(() => {
    if (!examinationsData) return {
      total: 0,
      fit: 0,
      fitWithRestriction: 0,
      fitWithCondition: 0,
      temporaryUnfit: 0,
      unfit: 0,
      completionRate: 0,
      expiringCertificates: 0,
    };

    const total = examinationsData.length;
    let fit = 0;
    let fitWithRestriction = 0;
    let fitWithCondition = 0;
    let temporaryUnfit = 0;
    let unfit = 0;
    let expiringCertificates = 0;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const today = new Date();
    // Set today to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);

    console.log('Processing examinations:', examinationsData.length);
    console.log('Today:', today.toISOString());
    console.log('Thirty days from now:', thirtyDaysFromNow.toISOString());

    examinationsData.forEach(exam => {
      const status = exam.fitness_status?.toLowerCase() || '';
      
      if (status.includes('fit') && !status.includes('unfit') && !status.includes('restriction')) {
        fit++;
      } else if (status.includes('restriction')) {
        fitWithRestriction++;
      } else if (status.includes('condition')) {
        fitWithCondition++;
      } else if (status.includes('temporary') && status.includes('unfit')) {
        temporaryUnfit++;
      } else if (status.includes('unfit')) {
        unfit++;
      }

      // Check for expiring certificates using the expiry_date column
      if (exam.expiry_date) {
        const expiryDate = new Date(exam.expiry_date);
        expiryDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        console.log('Checking expiry for exam:', exam.id, 'expiry_date:', exam.expiry_date, 'parsed:', expiryDate.toISOString());
        
        // Include certificates that expire within the next 30 days (including today and past dates)
        if (expiryDate <= thirtyDaysFromNow) {
          console.log('Certificate expiring soon:', exam.id, 'expires:', expiryDate.toISOString());
          expiringCertificates++;
        }
      }
    });

    const completionRate = total > 0 ? Math.round(((fit + fitWithRestriction + fitWithCondition) / total) * 100) : 0;

    const stats = {
      total,
      fit,
      fitWithRestriction,
      fitWithCondition,
      temporaryUnfit,
      unfit,
      completionRate,
      expiringCertificates,
    };

    console.log('Final certificate stats:', stats);
    return stats;
  }, [examinationsData]);

  // Extract common restrictions from examination data
  const commonRestrictions = React.useMemo(() => {
    if (!examinationsData) return [];

    const restrictionCount: { [key: string]: number } = {};

    examinationsData.forEach(exam => {
      if (exam.restrictions && Array.isArray(exam.restrictions)) {
        exam.restrictions.forEach((restriction: string) => {
          const key = restriction.toLowerCase();
          restrictionCount[key] = (restrictionCount[key] || 0) + 1;
        });
      }
    });

    return Object.entries(restrictionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([restriction, count]) => ({
        name: restriction.charAt(0).toUpperCase() + restriction.slice(1),
        count
      }));
  }, [examinationsData]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Certificate Statistics...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const total = certificateStats.total;
  const fitPercent = total > 0 ? Math.round((certificateStats.fit / total) * 100) : 0;
  const fitWithRestrictionPercent = total > 0 ? Math.round((certificateStats.fitWithRestriction / total) * 100) : 0;
  const fitWithConditionPercent = total > 0 ? Math.round((certificateStats.fitWithCondition / total) * 100) : 0;
  const temporaryUnfitPercent = total > 0 ? Math.round((certificateStats.temporaryUnfit / total) * 100) : 0;
  const unfitPercent = total > 0 ? Math.round((certificateStats.unfit / total) * 100) : 0;

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
                  Total: {total}
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
                      {certificateStats.fit} ({fitPercent}%)
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
                      {certificateStats.fitWithRestriction} (
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
                      {certificateStats.fitWithCondition} ({fitWithConditionPercent}
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
                      {certificateStats.temporaryUnfit} ({temporaryUnfitPercent}%)
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
                      {certificateStats.unfit} ({unfitPercent}%)
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
                    value={certificateStats.completionRate}
                    className="h-3 bg-muted [&>div]:bg-blue-500"
                  />
                </div>
                <span className="ml-2 font-medium">
                  {certificateStats.completionRate}%
                </span>
              </div>
            </div>

            {/* Add the new bar chart here */}
            <FitnessStatusBarChart data={certificateStats} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <ClipboardListIcon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total Certificates</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {total}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircleIcon className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Expiring Soon</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {certificateStats.expiringCertificates}
                </div>
                <div className="text-xs text-muted-foreground">
                  Next 30 days
                </div>
              </Card>
            </div>

            {commonRestrictions.length > 0 && (
              <Card className="p-4">
                <h3 className="font-medium mb-3">Common Restrictions</h3>
                <div className="flex flex-wrap gap-2">
                  {commonRestrictions.map((restriction, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      {restriction.name} ({restriction.count})
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="font-medium mb-3">Data Period</h3>
              <div className="text-sm text-muted-foreground">
                Showing data from the last{" "}
                {period === "month" ? "month" : period === "quarter" ? "3 months" : "year"}
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
