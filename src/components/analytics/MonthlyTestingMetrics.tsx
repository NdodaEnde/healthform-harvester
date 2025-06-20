
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MonthlyTestingMetrics = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch monthly testing data
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['monthly-testing-metrics', organizationId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('medical_examinations')
        .select('examination_date, patient_id, created_at')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('examination_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('examination_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate current month metrics
  const currentMonthMetrics = React.useMemo(() => {
    if (!monthlyData) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthTests = monthlyData.filter(exam => {
      const examDate = new Date(exam.examination_date);
      return examDate >= startOfMonth && examDate <= endOfMonth;
    });

    const uniquePatients = new Set(currentMonthTests.map(exam => exam.patient_id)).size;
    const totalTests = currentMonthTests.length;
    const averagePerDay = totalTests / now.getDate();

    // Processing turnaround times (examination_date vs created_at)
    const turnaroundTimes = currentMonthTests
      .filter(exam => exam.created_at)
      .map(exam => {
        const examDate = new Date(exam.examination_date);
        const createdDate = new Date(exam.created_at);
        return Math.abs((examDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter(days => days <= 30); // Filter out unrealistic values

    const avgTurnaround = turnaroundTimes.length > 0 
      ? turnaroundTimes.reduce((sum, days) => sum + days, 0) / turnaroundTimes.length 
      : 0;

    return {
      totalTests,
      uniquePatients,
      averagePerDay: Math.round(averagePerDay * 10) / 10,
      avgTurnaround: Math.round(avgTurnaround * 10) / 10
    };
  }, [monthlyData]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!monthlyData) return [];

    const monthlyGrouped = monthlyData.reduce((acc, exam) => {
      const month = new Date(exam.examination_date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, tests: 0, patients: new Set() };
      }
      acc[month].tests++;
      acc[month].patients.add(exam.patient_id);
      return acc;
    }, {} as Record<string, { month: string; tests: number; patients: Set<string> }>);

    return Object.values(monthlyGrouped)
      .map(data => ({
        month: new Date(data.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        tests: data.tests,
        uniquePatients: data.patients.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Month Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tests This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthMetrics?.totalTests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {currentMonthMetrics?.averagePerDay || 0} per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employees Tested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthMetrics?.uniquePatients || 0}</div>
            <p className="text-xs text-muted-foreground">Unique individuals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Turnaround
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthMetrics?.avgTurnaround || 0}d</div>
            <p className="text-xs text-muted-foreground">Processing time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {chartData.length > 1 ? 
                ((chartData[chartData.length - 1]?.tests || 0) >= (chartData[chartData.length - 2]?.tests || 0) ? '↗' : '↘') 
                : '→'
              }
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Testing Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Testing Volume</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test completion trends over the last 6 months
          </p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tests" fill="#3b82f6" name="Total Tests" />
                <Bar dataKey="uniquePatients" fill="#10b981" name="Unique Patients" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No testing data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyTestingMetrics;
