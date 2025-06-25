
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TestTypeBreakdownCard from './TestTypeBreakdownCard';

const BasicAnalyticsOverview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Basic Analytics - Available to all tiers */}
      <div className="space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-900">Examination Volume Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Breakdown of examination types and volumes
          </p>
        </div>
        
        {/* Row 1: Pre-employment, Periodical, Exit - Basic tier metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700">Pre-employment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">333</div>
              <p className="text-sm text-blue-600 mt-1">Initial health screenings</p>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-700">Periodical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">370</div>
              <p className="text-sm text-green-600 mt-1">Regular health checkups</p>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-700">Exit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-800">37</div>
              <p className="text-sm text-amber-600 mt-1">End of employment</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fitness Status Summary - Basic tier */}
      <div className="space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-900">Fitness Status Summary</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Current workforce fitness declarations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-emerald-700">Fit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-800">263</div>
              <p className="text-sm text-emerald-600 mt-1">No restrictions required</p>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-orange-700">Fit with Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800">4</div>
              <p className="text-sm text-orange-600 mt-1">Limited work activities</p>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-purple-700">Fit with Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">2</div>
              <p className="text-sm text-purple-600 mt-1">Conditional fitness</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Medical Tests Overview - Basic tier */}
      <div className="space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-2xl font-semibold text-gray-900">Medical Examination Conducted Includes The Following Tests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of medical tests included in examinations
          </p>
        </div>
        
        <TestTypeBreakdownCard className="w-full" />
      </div>
    </div>
  );
};

export default BasicAnalyticsOverview;
