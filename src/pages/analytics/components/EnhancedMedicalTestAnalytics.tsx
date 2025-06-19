
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
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  Eye, 
  Ear, 
  Heart, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Shield,
  Users,
  Building,
  Calendar,
  Target,
  AlertCircle
} from "lucide-react";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
const RISK_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981'
};

interface EnhancedMedicalTestAnalyticsProps {
  className?: string;
}

export default function EnhancedMedicalTestAnalytics({ className }: EnhancedMedicalTestAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<string>('executive');
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch executive summary data
  const { data: executiveSummary, isLoading: isLoadingExecutive } = useQuery({
    queryKey: ['executive-summary-refined', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_executive_summary_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch test results summary
  const { data: testResultsSummary, isLoading: isLoadingResults } = useQuery({
    queryKey: ['test-results-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_test_results_summary')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('total_tests', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch company health benchmarks
  const { data: companyBenchmarks, isLoading: isLoadingBenchmarks } = useQuery({
    queryKey: ['company-health-benchmarks', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_company_health_benchmarks')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('fitness_rate', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch risk assessment data
  const { data: riskAssessment, isLoading: isLoadingRisk } = useQuery({
    queryKey: ['risk-assessment-matrix', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_risk_assessment_matrix_refined')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_count', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch monthly trends
  const { data: monthlyTrends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['monthly-test-trends', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_monthly_test_trends')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .order('test_month', { ascending: true })
        .limit(12);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const getTestIcon = (testType: string) => {
    if (testType.includes('vision') || testType.includes('visual')) return Eye;
    if (testType.includes('hearing') || testType.includes('audio')) return Ear;
    if (testType.includes('lung') || testType.includes('spirometry') || testType.includes('chest')) return Activity;
    if (testType.includes('heart') || testType.includes('blood_pressure')) return Heart;
    if (testType.includes('heights')) return Shield;
    return Activity;
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200"
    };
    
    return (
      <Badge className={colors[riskLevel as keyof typeof colors] || colors.low}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </Badge>
    );
  };

  if (isLoadingExecutive || isLoadingResults || isLoadingBenchmarks || isLoadingRisk || isLoadingTrends) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading Enhanced Medical Analytics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process risk distribution data
  const riskDistribution = riskAssessment?.reduce((acc, item) => {
    acc[item.risk_level] = (acc[item.risk_level] || 0) + item.test_count;
    return acc;
  }, {} as Record<string, number>);

  const riskChartData = Object.entries(riskDistribution || {}).map(([level, count]) => ({
    name: level.charAt(0).toUpperCase() + level.slice(1),
    value: count,
    color: RISK_COLORS[level as keyof typeof RISK_COLORS]
  }));

  // Process monthly trends for chart
  const trendsChartData = monthlyTrends?.reduce((acc, item) => {
    const month = new Date(item.test_month).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    const existing = acc.find(entry => entry.month === month);
    if (existing) {
      existing.totalTests += item.test_count;
      existing.completedTests += item.completed_count;
      existing.abnormalTests += item.abnormal_count;
    } else {
      acc.push({
        month,
        totalTests: item.test_count,
        completedTests: item.completed_count,
        abnormalTests: item.abnormal_count,
        completionRate: item.completion_rate
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Enhanced Medical Test Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="executive">Executive Summary</TabsTrigger>
            <TabsTrigger value="test-results">Test Results</TabsTrigger>
            <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
            <TabsTrigger value="company-benchmarks">Company Benchmarks</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Total Patients</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {executiveSummary?.total_patients || 0}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Companies</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {executiveSummary?.total_companies || 0}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Tests Completed</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {executiveSummary?.total_tests_completed || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {executiveSummary?.overall_completion_rate || 0}% completion rate
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Health Score</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {executiveSummary?.health_score || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Overall health index
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Test Category Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Vision Tests', count: executiveSummary?.vision_tests || 0, icon: Eye },
                    { name: 'Hearing Tests', count: executiveSummary?.hearing_tests || 0, icon: Ear },
                    { name: 'Lung Function', count: executiveSummary?.lung_function_tests || 0, icon: Activity },
                    { name: 'Heights Tests', count: executiveSummary?.heights_tests || 0, icon: Shield },
                    { name: 'Drug Screens', count: executiveSummary?.drug_screen_tests || 0, icon: AlertTriangle }
                  ].map((test, index) => {
                    const IconComponent = test.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <Badge variant="outline">{test.count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Risk Level Distribution</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={riskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Key Health Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Vision Corrections</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-900">
                    {executiveSummary?.workers_may_need_vision_correction || 0}
                  </div>
                  <div className="text-xs text-amber-700">workers may need corrective lenses</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Ear className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Hearing Protection</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {executiveSummary?.workers_need_hearing_protection || 0}
                  </div>
                  <div className="text-xs text-blue-700">workers need hearing protection</div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Policy Violations</span>
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {executiveSummary?.policy_violations || 0}
                  </div>
                  <div className="text-xs text-red-700">requiring immediate attention</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="test-results">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Test Results Summary</h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={testResultsSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="test_type" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_tests" fill="#8884d8" name="Total Tests" />
                    <Bar dataKey="completed_tests" fill="#82ca9d" name="Completed" />
                    <Bar dataKey="abnormal_count" fill="#ff7300" name="Abnormal" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="risk-assessment">
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-medium mb-4">High-Risk Test Results</h3>
                <div className="space-y-3">
                  {riskAssessment?.filter(item => item.risk_level === 'high').slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.test_type}</span>
                          {getRiskBadge(item.risk_level)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.company_name} - {item.job_title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.risk_explanation}
                        </div>
                      </div>
                      <Badge variant="outline">{item.test_count} cases</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company-benchmarks">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Company Health Benchmarks</h3>
              <div className="space-y-4">
                {companyBenchmarks?.map((company, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{company.company_name}</h4>
                      <Badge variant="outline">{company.total_employees} employees</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fitness Rate:</span>
                        <div className="font-medium text-green-600">{company.fitness_rate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tests Completed:</span>
                        <div className="font-medium">{company.total_completed_tests}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Cert Duration:</span>
                        <div className="font-medium">{company.avg_cert_duration_days} days</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={company.fitness_rate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Monthly Test Trends</h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <AreaChart data={trendsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="totalTests" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="Total Tests"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completedTests" 
                      stackId="2" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="Completed"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="abnormalTests" 
                      stackId="3" 
                      stroke="#ff7300" 
                      fill="#ff7300" 
                      name="Abnormal"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
