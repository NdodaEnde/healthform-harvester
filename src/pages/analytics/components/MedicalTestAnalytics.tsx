
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { 
  Eye, 
  Ear, 
  Lungs, 
  Heart, 
  Activity,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

interface MedicalTestAnalyticsProps {
  className?: string;
}

export default function MedicalTestAnalytics({ className }: MedicalTestAnalyticsProps) {
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch medical test results data
  const { data: testResultsData, isLoading } = useQuery({
    queryKey: ['medical-test-results', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_test_results')
        .select(`
          *,
          medical_examinations!inner(
            examination_date,
            fitness_status,
            organization_id,
            client_organization_id
          )
        `)
        .or(`medical_examinations.organization_id.eq.${organizationId},medical_examinations.client_organization_id.eq.${organizationId}`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Process data for different visualizations
  const processedData = React.useMemo(() => {
    if (!testResultsData) return {
      testTypeDistribution: [],
      abnormalResults: [],
      testCompletionRates: [],
      trends: []
    };

    // Test type distribution
    const testTypeCounts = testResultsData.reduce((acc, test) => {
      acc[test.test_type] = (acc[test.test_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const testTypeDistribution = Object.entries(testTypeCounts).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      percentage: Math.round((count / testResultsData.length) * 100)
    }));

    // Abnormal results analysis
    const abnormalKeywords = ['abnormal', 'failed', 'inadequate', 'poor', 'below', 'impaired'];
    const abnormalResults = testResultsData.filter(test => 
      test.test_result && abnormalKeywords.some(keyword => 
        test.test_result.toLowerCase().includes(keyword)
      )
    );

    const abnormalByType = abnormalResults.reduce((acc, test) => {
      const typeName = test.test_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const abnormalResultsChart = Object.entries(abnormalByType).map(([type, count]) => ({
      name: type,
      count,
      percentage: Math.round((count / abnormalResults.length) * 100)
    }));

    // Test completion rates by type
    const completionRates = Object.entries(testTypeCounts).map(([type, count]) => ({
      testType: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      completed: count,
      completionRate: Math.round((count / testResultsData.length) * 100)
    }));

    return {
      testTypeDistribution,
      abnormalResults: abnormalResultsChart,
      testCompletionRates: completionRates,
      totalTests: testResultsData.length,
      totalAbnormal: abnormalResults.length
    };
  }, [testResultsData]);

  const getTestIcon = (testType: string) => {
    if (testType.includes('vision') || testType.includes('visual')) return Eye;
    if (testType.includes('hearing') || testType.includes('audio')) return Ear;
    if (testType.includes('lung') || testType.includes('spirometry') || testType.includes('chest')) return Lungs;
    if (testType.includes('heart') || testType.includes('blood_pressure')) return Heart;
    return Activity;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Medical Test Analytics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Medical Test Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distribution">Test Distribution</TabsTrigger>
            <TabsTrigger value="abnormal">Abnormal Results</TabsTrigger>
            <TabsTrigger value="completion">Completion Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total Tests</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {processedData.totalTests}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Abnormal Results</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {processedData.totalAbnormal}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((processedData.totalAbnormal / processedData.totalTests) * 100)}% of total
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Vision Tests</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {processedData.testTypeDistribution
                    .filter(t => t.name.toLowerCase().includes('vision') || t.name.toLowerCase().includes('visual'))
                    .reduce((sum, t) => sum + t.value, 0)}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Ear className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Hearing Tests</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {processedData.testTypeDistribution
                    .filter(t => t.name.toLowerCase().includes('hearing') || t.name.toLowerCase().includes('audio'))
                    .reduce((sum, t) => sum + t.value, 0)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-3">Test Type Breakdown</h3>
                <div className="space-y-2">
                  {processedData.testTypeDistribution.slice(0, 5).map((test, index) => {
                    const IconComponent = getTestIcon(test.name);
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <Badge variant="outline">{test.value}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-3">Abnormal Results by Type</h3>
                <div className="space-y-2">
                  {processedData.abnormalResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{result.name}</span>
                        <span>{result.count} cases</span>
                      </div>
                      <Progress 
                        value={result.percentage} 
                        className="h-2 bg-muted [&>div]:bg-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Test Type Distribution</h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={processedData.testTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {processedData.testTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="abnormal">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Abnormal Results Analysis</h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={processedData.abnormalResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="completion">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Test Completion Rates</h3>
              <div className="space-y-4">
                {processedData.testCompletionRates.map((test, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{test.testType}</span>
                      <span className="text-sm text-muted-foreground">
                        {test.completed} completed ({test.completionRate}%)
                      </span>
                    </div>
                    <Progress value={test.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
