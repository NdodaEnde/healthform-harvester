
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePackage } from '@/contexts/PackageContext';
import AnalyticsService, { AnalyticsInsight } from '@/services/AnalyticsService';
import { Lightbulb, TrendingUp, Shield, Zap, AlertCircle } from 'lucide-react';

const InsightsPanel: React.FC = () => {
  const { currentTier, colors, isPremium, isEnterprise } = usePackage();
  const insights = AnalyticsService.getInsightsForTier(currentTier);

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryIcon = (category: 'health' | 'compliance' | 'risk' | 'efficiency') => {
    switch (category) {
      case 'health':
        return <TrendingUp className="h-4 w-4" />;
      case 'compliance':
        return <Shield className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      case 'efficiency':
        return <Zap className="h-4 w-4" />;
    }
  };

  const renderInsight = (insight: AnalyticsInsight) => (
    <Card key={insight.id} className="relative">
      <div className="absolute top-3 right-3">
        <Badge variant="outline" className={getImpactColor(insight.impact)}>
          {insight.impact.toUpperCase()}
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 pr-16">
          {getCategoryIcon(insight.category)}
          {insight.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {insight.category.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {insight.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {insight.description}
        </p>
        {insight.recommendation && (
          <div className={`p-3 rounded-lg ${colors.background} border ${colors.border}`}>
            <p className={`text-sm ${colors.text} font-medium`}>
              💡 Recommendation: {insight.recommendation}
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            View Details
          </Button>
          {(isPremium || isEnterprise) && (
            <Button size="sm" variant="outline">
              Set Alert
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-2`}>
            <Lightbulb className="h-6 w-6" />
            AI-Powered Insights
          </h2>
          <p className="text-muted-foreground">
            {isEnterprise ? 'Strategic recommendations based on competitive analysis' :
             isPremium ? 'Advanced insights powered by predictive analytics' :
             'Essential insights to improve your health management'}
          </p>
        </div>
        <Badge variant="outline" className={`${colors.background} ${colors.text}`}>
          {insights.length} Active Insights
        </Badge>
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Insights Available</h3>
            <p className="text-muted-foreground mb-4">
              Generate some data to receive AI-powered insights and recommendations.
            </p>
            <Button variant="outline">
              Learn More
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map(renderInsight)}
        </div>
      )}

      {!isEnterprise && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-dashed">
          <CardContent className="text-center py-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">
              Unlock Advanced Insights
            </h3>
            <p className="text-muted-foreground mb-4">
              {isPremium 
                ? 'Upgrade to Enterprise for competitive benchmarking and strategic intelligence.'
                : 'Upgrade to Premium for AI-powered insights and predictive analytics.'
              }
            </p>
            <Button>
              {isPremium ? 'Upgrade to Enterprise' : 'Upgrade to Premium'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsPanel;
