
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePackage } from '@/contexts/PackageContext';
import EnhancedBasicOverviewTab from '@/components/analytics/EnhancedBasicOverviewTab';
import PremiumOverviewTab from '@/components/analytics/PremiumOverviewTab';
import BasicReports from '@/components/analytics/BasicReports';
import PremiumReports from '@/components/analytics/PremiumReports';
import BasicAnalyticsDashboard from '@/components/analytics/BasicAnalyticsDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, BarChart3, Zap } from 'lucide-react';

export default function AnalyticsPage() {
  const { currentTier, isBasic, isPremium, isEnterprise } = usePackage();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive health analytics and insights for your organization
          </p>
        </div>
        <Badge variant="outline" className={`
          ${isEnterprise ? 'bg-purple-100 text-purple-800' : ''}
          ${isPremium ? 'bg-yellow-100 text-yellow-800' : ''}
          ${isBasic ? 'bg-blue-100 text-blue-800' : ''}
        `}>
          {currentTier.toUpperCase()} Plan
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger 
            value="insights" 
            className="flex items-center gap-2"
            disabled={isBasic}
          >
            <BarChart3 className="h-4 w-4" />
            Insights {isBasic && <span className="text-xs">(Premium)</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="flex items-center gap-2"
            disabled={!isEnterprise}
          >
            <Zap className="h-4 w-4" />
            Advanced {!isEnterprise && <span className="text-xs">(Enterprise)</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isBasic ? (
            <BasicAnalyticsDashboard />
          ) : (
            <PremiumOverviewTab />
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {isBasic ? (
            <BasicReports />
          ) : (
            <PremiumReports />
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {isBasic ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
                    <p className="text-muted-foreground mb-4">
                      Advanced insights and trend analysis are available with Premium subscription.
                    </p>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                      Upgrade to Premium
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <PremiumOverviewTab />
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Enterprise Feature</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced analytics, competitive benchmarking, and strategic insights are available with Enterprise subscription.
                  </p>
                  <Badge variant="outline" className="bg-purple-50 text-purple-800">
                    Upgrade to Enterprise
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
