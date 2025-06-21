
import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePackage } from '@/contexts/PackageContext';
import DrillDownAnalyticsDashboard from './DrillDownAnalyticsDashboard';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { Drill, Zap, Crown } from 'lucide-react';

const AdvancedAnalyticsTab: React.FC = () => {
  const { currentTier, isPremium, isEnterprise, colors } = usePackage();

  if (!isPremium && !isEnterprise) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
          <CardContent className="p-6 text-center">
            <Drill className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Interactive Analytics</h3>
            <p className="text-muted-foreground mb-4">
              Explore your data with interactive drill-down charts and advanced insights.
            </p>
            <Badge variant="outline" className="mb-4">
              Premium Feature
            </Badge>
          </CardContent>
        </Card>

        <UpgradePromptCard
          targetTier="premium"
          title="Unlock Interactive Analytics"
          description="Dive deeper into your data with interactive charts and drill-down capabilities."
          features={[
            'Interactive drill-down charts',
            'Multi-level data exploration',
            'Advanced filtering and sorting',
            'Custom chart configurations',
            'Real-time data interactions',
            'Export interactive reports'
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${isEnterprise ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Interactive Analytics Dashboard
              </h2>
              <p className="text-gray-600 mb-4">
                {isEnterprise ? 
                  'Enterprise-grade interactive analytics with advanced drill-down capabilities and strategic insights.' :
                  'Premium interactive charts with drill-down functionality for deeper data exploration.'
                }
              </p>
              <Badge className={isEnterprise ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                {isEnterprise ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Enterprise Interactive Analytics
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Premium Interactive Charts
                  </>
                )}
              </Badge>
            </div>
            <Drill className={`h-12 w-12 ${isEnterprise ? 'text-purple-600' : 'text-blue-600'}`} />
          </div>
        </CardContent>
      </Card>

      {/* Interactive Dashboard */}
      <Suspense fallback={
        <div className="space-y-6">
          <FeatureSkeleton type="chart" className="h-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeatureSkeleton type="chart" className="h-64" />
            <FeatureSkeleton type="chart" className="h-64" />
          </div>
        </div>
      }>
        <DrillDownAnalyticsDashboard />
      </Suspense>

      {/* Feature Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Drill className="h-5 w-5" />
            How to Use Interactive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 ${colors.background} rounded-lg border ${colors.border}`}>
            <h4 className="font-medium mb-3">Interactive Features:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Click on chart elements</strong> to drill down into detailed views</li>
              <li>• <strong>Use the Back button</strong> to navigate between drill-down levels</li>
              <li>• <strong>Hover over data points</strong> for detailed tooltips</li>
              <li>• <strong>Multi-level exploration</strong> - go from overview to specific details</li>
              {isEnterprise && (
                <li>• <strong>Enterprise insights</strong> - Access strategic-level analytics</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalyticsTab;
