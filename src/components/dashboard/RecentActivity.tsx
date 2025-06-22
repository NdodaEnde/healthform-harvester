
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, User, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export function RecentActivity() {
  // Mock data - in real app this would come from props or API
  const activities = [
    {
      id: '1',
      type: 'document_processed',
      user: 'System',
      action: 'processed medical certificate for John Smith',
      timestamp: '5 minutes ago',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    {
      id: '2',
      type: 'user_login',
      user: 'Dr. Sarah Wilson',
      action: 'logged into the system',
      timestamp: '15 minutes ago',
      icon: User,
      iconColor: 'text-blue-600'
    },
    {
      id: '3',
      type: 'document_uploaded',
      user: 'Mike Johnson',
      action: 'uploaded fitness assessment document',
      timestamp: '1 hour ago',
      icon: FileText,
      iconColor: 'text-purple-600'
    },
    {
      id: '4',
      type: 'processing_failed',
      user: 'System',
      action: 'failed to process document - invalid format',
      timestamp: '2 hours ago',
      icon: AlertTriangle,
      iconColor: 'text-red-600'
    },
    {
      id: '5',
      type: 'certificate_expiring',
      user: 'System',
      action: 'certificate expiring in 30 days for Jane Doe',
      timestamp: '3 hours ago',
      icon: Clock,
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <IconComponent className={`h-5 w-5 mt-0.5 ${activity.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
