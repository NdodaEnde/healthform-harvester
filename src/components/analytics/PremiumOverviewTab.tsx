
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackage } from '@/contexts/PackageContext';
import EnhancedMetricsDashboard from '@/components/analytics/EnhancedMetricsDashboard';
import InsightsPanel from '@/components/analytics/InsightsPanel';
import ReportsGenerator from '@/components/analytics/ReportsGenerator';
import { BarChart3, Lightbulb, FileText } from 'lucide-react';

const PremiumOverviewTab: React.FC = () => {
  const { colors } = usePackage();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className={`${colors.background}`}>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metrics Dashboard
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-4">
          <EnhancedMetricsDashboard />
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4">
          <InsightsPanel />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <ReportsGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumOverviewTab;
