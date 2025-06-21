
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import PremiumOverviewTab from '@/components/analytics/PremiumOverviewTab';
import BasicOverviewTab from '@/components/analytics/BasicOverviewTab';
import ExecutiveSummaryBanner from './components/ExecutiveSummaryBanner';
import { Badge } from "@/components/ui/badge";

const AnalyticsPage = () => {
  const { 
    currentTier, 
    language, 
    colors, 
    displayName, 
    canAccessFeature,
    isPremium,
    isEnterprise 
  } = usePackage();

  const isPremiumOrHigher = canAccessFeature('premium');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-3xl font-bold ${colors.text}`}>
              {language.dashboardTitle}
            </h1>
            <Badge 
              variant="outline" 
              className={`${colors.background} ${colors.border} ${colors.accent}`}
            >
              {displayName}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isPremiumOrHigher 
              ? language.executiveSummaryDescription
              : "Essential health metrics and compliance overview"
            }
          </p>
          {isEnterprise && (
            <p className="text-sm text-purple-600 mt-1">
              ✨ Strategic Command Center with competitive benchmarking
            </p>
          )}
        </div>
      </div>

      <ExecutiveSummaryBanner />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className={`${colors.background}`}>
          <TabsTrigger value="overview" className={`data-[state=active]:${colors.primary} data-[state=active]:text-white`}>
            Overview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {isPremiumOrHigher ? (
            <PremiumOverviewTab />
          ) : (
            <BasicOverviewTab />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
