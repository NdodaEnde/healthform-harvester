
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    console.log(`Quick action triggered: ${action}`);
    
    switch (action) {
      case 'upload':
        navigate('/documents');
        break;
      case 'view-employees':
        navigate('/patients');
        break;
      case 'generate-report':
        navigate('/reports');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1 justify-start gap-3 h-12 bg-blue-600 hover:bg-blue-700"
            onClick={() => handleAction('upload')}
          >
            <Upload className="h-5 w-5" />
            Upload Document
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 justify-start gap-3 h-12"
            onClick={() => handleAction('view-employees')}
          >
            <Users className="h-5 w-5" />
            View Employees
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 justify-start gap-3 h-12"
            onClick={() => handleAction('generate-report')}
          >
            <FileText className="h-5 w-5" />
            Generate Report
          </Button>
        </div>
        
        {/* Upgrade Prompt */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">Need advanced analytics?</p>
          <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-800">
            Upgrade to Premium →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
