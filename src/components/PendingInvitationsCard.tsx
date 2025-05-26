
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

const PendingInvitationsCard: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      if (!currentOrganization?.id) return;

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface with proper error handling
      if (data && Array.isArray(data)) {
        const transformedInvitations: Invitation[] = data.map(invitation => ({
          id: invitation.id || '',
          email: invitation.email || '',
          role: invitation.role || '',
          created_at: invitation.created_at || '',
          expires_at: invitation.expires_at || ''
        }));
        
        setInvitations(transformedInvitations);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load pending invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentOrganization?.id]);

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      
      toast.success('Invitation cancelled');
      fetchInvitations(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            No pending invitations at this time
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations ({invitations.length})
        </CardTitle>
        <CardDescription>
          Users who have been invited but haven't joined yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invitation.email}</span>
                  <Badge variant="outline">{invitation.role}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sent: {new Date(invitation.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelInvitation(invitation.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsCard;
