
import React from 'react';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';
import { usePackage } from '@/contexts/PackageContext';
import { FeatureKey, PackageTier } from '@/types/subscription';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from 'lucide-react';

interface AnalyticsFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

const AnalyticsFeatureGate: React.FC<AnalyticsFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  className
}) => {
  const { colors } = usePackage();

  // Custom fallback for analytics features
  const analyticsUpgradeFallback = (
    <Card className={`border-dashed border-2 ${colors.border} ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className={`mx-auto mb-2 p-3 rounded-full ${colors.background} w-fit`}>
          <BarChart3 className={`h-6 w-6 ${colors.accent}`} />
        </div>
        <CardTitle className="text-lg">
          {title || 'Advanced Analytics Feature'}
        </CardTitle>
        <div className="flex justify-center">
          <Badge variant="outline" className={`${colors.background} ${colors.border} ${colors.accent}`}>
            {requiredTier?.toUpperCase() || 'PREMIUM'} REQUIRED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {description || 'This advanced analytics feature requires a higher tier subscription.'}
        </p>
        <div className={`p-4 ${colors.background} rounded-lg border ${colors.border}`}>
          <p className={`text-sm ${colors.text} font-medium`}>
            Unlock powerful insights and data-driven decision making
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <EnhancedFeatureGate
      feature={feature}
      requiredTier={requiredTier}
      fallback={analyticsUpgradeFallback}
      className={className}
    >
      {children}
    </EnhancedFeatureGate>
  );
};

export default AnalyticsFeatureGate;
