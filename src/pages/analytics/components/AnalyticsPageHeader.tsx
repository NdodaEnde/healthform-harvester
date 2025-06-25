
import React from 'react';
import { Helmet } from 'react-helmet';
import { Badge } from "@/components/ui/badge";

const AnalyticsPageHeader: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Occupational Health Analytics | Health Management System</title>
      </Helmet>
      
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Occupational Health Analytics</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live System
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Comprehensive insights into occupational health metrics, compliance status, and workforce analytics.
        </p>
      </div>
    </>
  );
};

export default AnalyticsPageHeader;
