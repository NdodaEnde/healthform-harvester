
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Building2, TrendingUp, Award, Users, Target, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';

const CompanyBenchmarkingDashboard = () => {
  const { companyBenchmarks, executiveSummary, isLoading } = useEnhancedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate industry benchmarks
  const industryBenchmarks = React.useMemo(() => {
    if (!companyBenchmarks || companyBenchmarks.length === 0) return null;

    const totalCompanies = companyBenchmarks.length;
    const avgFitnessRate = companyBenchmarks.reduce((sum, company) => sum + (company.fitness_rate || 0), 0) / totalCompanies;
    const avgEmployeesPerCompany = companyBenchmarks.reduce((sum, company) => sum + (company.total_employees || 0), 0) / totalCompanies;
    const avgCompletionRate = companyBenchmarks.reduce((sum, company) => {
      const rate = company.total_tests_ordered > 0 ? (company.total_completed_tests / company.total_tests_ordered) * 100 : 0;
      return sum + rate;
    }, 0) / totalCompanies;

    return {
      avgFitnessRate: avgFitnessRate.toFixed(1),
      avgEmployeesPerCompany: Math.round(avgEmployeesPerCompany),
      avgCompletionRate: avgCompletionRate.toFixed(1),
      topPerformer: companyBenchmarks[0]?.company_name || 'N/A',
      totalCompanies
    };
  }, [companyBenchmarks]);

  // Performance categories
  const getPerformanceCategory = (fitnessRate: number) => {
    if (fitnessRate >= 95) return { label: 'Excellent', color: 'text-green-600 bg-green-50 border-green-200' };
    if (fitnessRate >= 85) return { label: 'Good', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (fitnessRate >= 75) return { label: 'Average', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  // Prepare chart data
  const chartData = companyBenchmarks?.slice(0, 10).map(company => ({
    company: company.company_name?.substring(0, 15) + (company.company_name?.length > 15 ? '...' : ''),
    fullName: company.company_name,
    fitnessRate: company.fitness_rate || 0,
    employees: company.total_employees || 0,
    completionRate: company.total_tests_ordered > 0 ? 
      ((company.total_completed_tests / company.total_tests_ordered) * 100).toFixed(1) : 0,
    examinations: company.total_examinations || 0
  })) || [];

  // Scatter plot data for employee count vs fitness rate
  const scatterData = companyBenchmarks?.map(company => ({
    employees: company.total_employees || 0,
    fitnessRate: company.fitness_rate || 0,
    name: company.company_name
  })) || [];

  if (!industryBenchmarks) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">No company benchmark data available. Complete more medical examinations to see comparisons.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Industry Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Industry Average</p>
                <p className="text-2xl font-bold text-blue-700">{industryBenchmarks.avgFitnessRate}%</p>
                <p className="text-xs text-blue-600">Fitness Rate</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Top Performer</p>
                <p className="text-lg font-bold text-green-700 truncate">{industryBenchmarks.topPerformer}</p>
                <p className="text-xs text-green-600">Leading Company</p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Company Size</p>
                <p className="text-2xl font-bold text-purple-700">{industryBenchmarks.avgEmployeesPerCompany}</p>
                <p className="text-xs text-purple-600">Employees</p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Avg Completion</p>
                <p className="text-2xl font-bold text-indigo-700">{industryBenchmarks.avgCompletionRate}%</p>
                <p className="text-xs text-indigo-600">Test Completion</p>
              </div>
              <div className="p-2 bg-indigo-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Fitness Rate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Company Fitness Rate Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, 'Fitness Rate']}
                  labelFormatter={(label) => {
                    const company = chartData.find(c => c.company === label);
                    return company?.fullName || label;
                  }}
                />
                <Bar dataKey="fitnessRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employee Count vs Fitness Rate Scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Company Size vs Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="employees" name="Employees" />
                <YAxis dataKey="fitnessRate" name="Fitness Rate" domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'fitnessRate' ? `${value}%` : value,
                    name === 'fitnessRate' ? 'Fitness Rate' : 'Employees'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.name;
                    }
                    return '';
                  }}
                />
                <Scatter dataKey="fitnessRate" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Company Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Company Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companyBenchmarks?.slice(0, 15).map((company, index) => {
              const category = getPerformanceCategory(company.fitness_rate || 0);
              const completionRate = company.total_tests_ordered > 0 ? 
                ((company.total_completed_tests / company.total_tests_ordered) * 100).toFixed(1) : '0';
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{company.company_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{company.total_employees} employees</span>
                        <span>{company.total_examinations} examinations</span>
                        <span>{completionRate}% completion</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={category.color}>
                      {category.label}
                    </Badge>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{company.fitness_rate?.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500">Fitness Rate</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyBenchmarkingDashboard;
