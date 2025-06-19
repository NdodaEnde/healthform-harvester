
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Users, Shield, AlertTriangle, TrendingUp, Calendar, Award } from 'lucide-react';

const ExecutiveSummaryBanner = () => {
  const { executiveSummary, isLoading } = useEnhancedAnalytics();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!executiveSummary) {
    return (
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">No analytics data available. Upload medical certificates to see insights.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = executiveSummary.health_score || 0;
  const completionRate = executiveSummary.overall_completion_rate || 0;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Executive Health Overview</h2>
              <p className="text-gray-600">Real-time occupational health metrics across your organizations</p>
            </div>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Live Data
            </Badge>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Workforce */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {executiveSummary.total_patients?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>

            {/* Health Score */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getHealthScoreColor(healthScore).split(' ')[0]}`}>
                  {healthScore}%
                </p>
                <p className="text-sm text-gray-600">Health Score</p>
              </div>
            </div>

            {/* High Risk Cases */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {executiveSummary.high_risk_results?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">High Risk</p>
              </div>
            </div>

            {/* Completion Rate */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getCompletionRateColor(completionRate)}`}>
                  {completionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Completion</p>
              </div>
            </div>

            {/* Active Companies */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Award className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {executiveSummary.total_companies?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Companies</p>
              </div>
            </div>

            {/* Fit Workers */}
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {executiveSummary.total_fit?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Fit Workers</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-blue-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Workers Needing Vision Correction</p>
              <p className="text-lg font-semibold text-amber-600">
                {executiveSummary.workers_may_need_vision_correction?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Hearing Protection Required</p>
              <p className="text-lg font-semibold text-orange-600">
                {executiveSummary.workers_need_hearing_protection?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Policy Violations</p>
              <p className="text-lg font-semibold text-red-600">
                {executiveSummary.policy_violations?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveSummaryBanner;
