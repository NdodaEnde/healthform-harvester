
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from '@/hooks/useSubscription';
import TaskManagementDashboard from '@/components/tasks/TaskManagementDashboard';
import BasicTaskManagement from '@/components/tasks/BasicTaskManagement';

// Import refactored components
import AnalyticsPageHeader from './components/AnalyticsPageHeader';
import BasicOverviewTab from '@/components/analytics/BasicOverviewTab';
import BasicAnalyticsOverview from './components/BasicAnalyticsOverview';
import PremiumAnalyticsFeatures from './components/PremiumAnalyticsFeatures';
import RiskComplianceTab from './components/RiskComplianceTab';
import ReportsToolsTab from './components/ReportsToolsTab';

const IntegratedOccupationalHealthPage = () => {
  const { canAccessFeature } = useSubscription();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AnalyticsPageHeader />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex lg:h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="risk-compliance" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Risk & Compliance
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Task Management
          </TabsTrigger>
          <TabsTrigger value="reports-tools" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            Reports & Tools
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <BasicOverviewTab />
        </TabsContent>
        
        {/* Analytics Tab - Now with Feature Gates */}
        <TabsContent value="analytics" className="space-y-8">
          <BasicAnalyticsOverview />
          <PremiumAnalyticsFeatures />
        </TabsContent>
        
        {/* Risk & Compliance Tab */}
        <TabsContent value="risk-compliance" className="space-y-6">
          <RiskComplianceTab />
        </TabsContent>

        {/* Task Management Tab - Now Gated by Subscription */}
        <TabsContent value="tasks" className="space-y-6">
          {canAccessFeature('premium') ? (
            <TaskManagementDashboard />
          ) : (
            <BasicTaskManagement />
          )}
        </TabsContent>

        {/* Reports & Tools Tab */}
        <TabsContent value="reports-tools" className="space-y-6">
          <ReportsToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
