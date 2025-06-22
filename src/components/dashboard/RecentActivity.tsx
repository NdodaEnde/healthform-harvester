
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export function RecentActivity() {  
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch recent activities from various tables
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      const activities = [];

      // Get recent documents
      const { data: recentDocs } = await supabase
        .from('documents')
        .select('created_at, status, file_name')
        .or(orgFilter)
        .order('created_at', { ascending: false })
        .limit(5);

      recentDocs?.forEach(doc => {
        activities.push({
          id: `doc-${doc.created_at}`,
          type: doc.status === 'processed' ? 'Document processed' : 'Document uploaded',
          time: new Date(doc.created_at),
          icon: doc.status === 'processed' ? CheckCircle : FileText,
          iconColor: doc.status === 'processed' ? 'text-green-600' : 'text-blue-600',
          bgColor: doc.status === 'processed' ? 'bg-green-100' : 'bg-blue-100'
        });
      });

      // Get recent examinations
      const { data: recentExams } = await supabase
        .from('medical_examinations')
        .select('created_at, fitness_status')
        .or(orgFilter)
        .order('created_at', { ascending: false })
        .limit(3);

      recentExams?.forEach(exam => {
        activities.push({
          id: `exam-${exam.created_at}`,
          type: exam.fitness_status === 'Fit' ? 'Certificate processed' : 'Medical examination completed',
          time: new Date(exam.created_at),
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-100'
        });
      });

      // Get expiring certificates
      const { data: expiringCerts } = await supabase
        .from('certificate_compliance')
        .select('current_expiry_date')
        .or(orgFilter)
        .not('current_expiry_date', 'is', null)
        .gte('current_expiry_date', new Date().toISOString().split('T')[0])
        .lte('current_expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .limit(2);

      expiringCerts?.forEach(cert => {
        activities.push({
          id: `cert-exp-${cert.current_expiry_date}`,
          type: 'Certificate expires soon',
          time: new Date(cert.current_expiry_date),
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        });
      });

      // Sort by time and return most recent 4
      return activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 4)
        .map(activity => ({
          ...activity,
          time: formatTimeAgo(activity.time)
        }));
    },
    enabled: !!organizationId,
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading activity...</div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => {
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
            })
          ) : (
            <div className="text-sm text-muted-foreground">No recent activity</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
