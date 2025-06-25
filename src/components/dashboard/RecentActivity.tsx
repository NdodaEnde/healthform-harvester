
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, UserPlus, Clock } from 'lucide-react';
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

      const activities = [];

      // Get recent documents (last 7 days)
      const { data: recentDocs } = await supabase
        .from('documents')
        .select('created_at, processed_at, status, file_name, document_type')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      recentDocs?.forEach(doc => {
        if (doc.status === 'processed' && doc.processed_at) {
          activities.push({
            id: `doc-processed-${doc.created_at}`,
            type: `${formatDocumentType(doc.document_type)} processed`,
            time: new Date(doc.processed_at),
            icon: CheckCircle,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            description: doc.file_name?.substring(0, 30) + '...' || 'Document processed'
          });
        } else if (doc.status === 'uploaded') {
          activities.push({
            id: `doc-uploaded-${doc.created_at}`,
            type: `${formatDocumentType(doc.document_type)} uploaded`,
            time: new Date(doc.created_at),
            icon: FileText,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            description: doc.file_name?.substring(0, 30) + '...' || 'Document uploaded'
          });
        }
      });

      // Get recent medical examinations (last 7 days)
      const { data: recentExams } = await supabase
        .from('medical_examinations')
        .select(`
          created_at, 
          examination_date, 
          fitness_status,
          patients!inner(first_name, last_name)
        `)
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      recentExams?.forEach(exam => {
        const patientName = `${exam.patients[0]?.first_name || ''} ${exam.patients[0]?.last_name || ''}`.trim();
        activities.push({
          id: `exam-${exam.created_at}`,
          type: 'Medical examination completed',
          time: new Date(exam.created_at),
          icon: CheckCircle,
          iconColor: exam.fitness_status === 'fit' ? 'text-green-600' : 'text-yellow-600',
          bgColor: exam.fitness_status === 'fit' ? 'bg-green-100' : 'bg-yellow-100',
          description: patientName || 'Medical examination'
        });
      });

      // Get recent patients added (last 7 days)
      const { data: recentPatients } = await supabase
        .from('patients')
        .select('created_at, first_name, last_name')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      recentPatients?.forEach(patient => {
        const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
        activities.push({
          id: `patient-${patient.created_at}`,
          type: 'New patient registered',
          time: new Date(patient.created_at),
          icon: UserPlus,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: patientName || 'New patient'
        });
      });

      // Sort by time and return most recent 6
      return activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 6)
        .map(activity => ({
          ...activity,
          timeAgo: formatTimeAgo(activity.time)
        }));
    },
    enabled: !!organizationId,
  });

  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'certificate-fitness':
      case 'fitness-certificate':
        return 'Certificate';
      case 'medical-certificate':
        return 'Medical Certificate';
      case 'medical-questionnaire':
        return 'Questionnaire';
      default:
        return 'Document';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
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
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${activity.bgColor} flex-shrink-0`}>
                    <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.timeAgo}</p>
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
