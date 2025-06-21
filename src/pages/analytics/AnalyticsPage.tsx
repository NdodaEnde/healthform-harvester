
import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import PremiumOverviewTab from '@/components/analytics/PremiumOverviewTab';
import BasicOverviewTab from '@/components/analytics/BasicOverviewTab';
import RealDataAnalyticsDashboard from '@/components/analytics/RealDataAnalyticsDashboard';
import ExecutiveSummaryBanner from './components/ExecutiveSummaryBanner';
import PackageStatusBanner from '@/components/PackageStatusBanner';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { Badge } from "@/components/ui/badge";
import { Sparkles, Database } from "lucide-react";

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 animate-fade-in">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 className={`text-2xl sm:text-3xl font-bold ${colors.text} transition-colors duration-300`}>
              {language.dashboardTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${colors.background} ${colors.border} ${colors.accent} transition-all duration-300 hover:scale-105 w-fit`}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {displayName}
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 border-green-200"
              >
                <Database className="h-3 w-3 mr-1" />
                Real-Time Data
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isPremiumOrHigher 
              ? language.executiveSummaryDescription
              : "Essential health metrics and compliance overview with live data integration"
            }
          </p>
          {isEnterprise && (
            <p className="text-sm text-purple-600 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              ✨ Strategic Command Center with competitive benchmarking and real-time intelligence
            </p>
          )}
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <PackageStatusBanner />
      </div>

      <Suspense fallback={<FeatureSkeleton type="card" className="h-32" />}>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <ExecutiveSummaryBanner />
        </div>
      </Suspense>

      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className={`${colors.background} grid w-full max-w-lg transition-all duration-300`}>
            <TabsTrigger 
              value="overview" 
              className={`data-[state=active]:${colors.primary} data-[state=active]:text-white transition-all duration-300`}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="realtime" 
              className={`data-[state=active]:${colors.primary} data-[state=active]:text-white transition-all duration-300`}
            >
              Real-Time Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 min-h-[400px]">
            <Suspense fallback={
              <div className="space-y-4">
                <FeatureSkeleton type="chart" className="h-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <FeatureSkeleton key={i} type="card" className="h-32" />
                  ))}
                </div>
              </div>
            }>
              {isPremiumOrHigher ? (
                <div className="animate-fade-in">
                  <PremiumOverviewTab />
                </div>
              ) : (
                <div className="animate-fade-in">
                  <BasicOverviewTab />
                </div>
              )}
            </Suspense>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4 min-h-[400px]">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <FeatureSkeleton key={i} type="card" className="h-32" />
                  ))}
                </div>
                <FeatureSkeleton type="chart" className="h-64" />
                <div className="grid gap-4 md:grid-cols-2">
                  {[...Array(2)].map((_, i) => (
                    <FeatureSkeleton key={i} type="chart" className="h-64" />
                  ))}
                </div>
              </div>
            }>
              <div className="animate-fade-in">
                <RealDataAnalyticsDashboard />
              </div>
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsPage;
