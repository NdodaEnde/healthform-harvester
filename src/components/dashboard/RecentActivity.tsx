
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, Users } from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      id: '1',
      type: 'Document uploaded',
      time: '2 hours ago',
      icon: FileText,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: '2',
      type: 'Certificate processed',
      time: '5 hours ago',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: '3',
      type: 'Certificate expires soon',
      time: '1 day ago',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: '4',
      type: 'Compliance check passed',
      time: '2 days ago',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.type}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
