
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
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            className="flex-1 justify-center gap-2 h-12 bg-black hover:bg-gray-800 text-white font-medium"
            onClick={() => handleAction('upload')}
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 justify-center gap-2 h-12 border-gray-200 hover:bg-gray-50 font-medium"
            onClick={() => handleAction('view-employees')}
          >
            <Users className="h-4 w-4" />
            Review Documents
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 justify-center gap-2 h-12 border-gray-200 hover:bg-gray-50 font-medium"
            onClick={() => handleAction('generate-report')}
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
        
        {/* Upgrade Prompt */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">Need advanced analytics?</p>
          <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-800">
            Upgrade to Premium →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
