
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users, FileText, Settings, Download, Plus } from 'lucide-react';

export function QuickActions() {
  const handleAction = (action: string) => {
    console.log(`Quick action triggered: ${action}`);
    // In real app, these would navigate to appropriate pages or trigger actions
  };

  const actions = [
    {
      id: 'upload',
      label: 'Upload Document',
      icon: Upload,
      description: 'Upload new medical documents',
      variant: 'default' as const,
      onClick: () => handleAction('upload')
    },
    {
      id: 'add-patient',
      label: 'Add Patient',
      icon: Plus,
      description: 'Register new patient',
      variant: 'outline' as const,
      onClick: () => handleAction('add-patient')
    },
    {
      id: 'view-patients',
      label: 'View Patients',
      icon: Users,
      description: 'Browse patient records',
      variant: 'outline' as const,
      onClick: () => handleAction('view-patients')
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: FileText,
      description: 'Create compliance reports',
      variant: 'outline' as const,
      onClick: () => handleAction('generate-report')
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      description: 'Download patient data',
      variant: 'outline' as const,
      onClick: () => handleAction('export-data')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'System configuration',
      variant: 'outline' as const,
      onClick: () => handleAction('settings')
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                onClick={action.onClick}
              >
                <IconComponent className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
