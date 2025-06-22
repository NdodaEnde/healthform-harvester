
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users, FileText } from 'lucide-react';

export function QuickActions() {
  const handleAction = (action: string) => {
    console.log(`Quick action triggered: ${action}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start gap-3 h-12 bg-blue-600 hover:bg-blue-700"
          onClick={() => handleAction('upload')}
        >
          <Upload className="h-5 w-5" />
          Upload Document
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-12"
          onClick={() => handleAction('view-employees')}
        >
          <Users className="h-5 w-5" />
          View Employees
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-12"
          onClick={() => handleAction('generate-report')}
        >
          <FileText className="h-5 w-5" />
          Generate Report
        </Button>
        
        {/* Upgrade Prompt */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">Need advanced analytics?</p>
          <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-800">
            Upgrade to Premium →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
