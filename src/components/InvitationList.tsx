
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  token: string;
}

interface InvitationListProps {
  organizationId: string;
  onInvitationDeleted?: () => void;
}

const InvitationList: React.FC<InvitationListProps> = ({ organizationId, onInvitationDeleted }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organizationId as any)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const validInvitations = data.filter((item): item is NonNullable<typeof item> => {
          return item !== null && 
                 typeof item === 'object' &&
                 typeof item.id === 'string' &&
                 typeof item.email === 'string' &&
                 typeof item.role === 'string' &&
                 typeof item.created_at === 'string' &&
                 typeof item.expires_at === 'string' &&
                 typeof item.token === 'string';
        });

        const typedInvitations: Invitation[] = validInvitations.map(item => ({
          id: item.id,
          email: item.email,
          role: item.role,
          created_at: item.created_at,
          expires_at: item.expires_at,
          accepted_at: item.accepted_at ? String(item.accepted_at) : null,
          token: item.token
        }));

        setInvitations(typedInvitations);
      } else {
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchInvitations();
    }
  }, [organizationId]);

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId as any);

      if (error) throw error;

      toast.success('Invitation deleted successfully');
      fetchInvitations();
      onInvitationDeleted?.();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge variant="default">Accepted</Badge>;
    }
    
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Pending Invitations</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchInvitations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No pending invitations</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{invitation.email}</span>
                    {getStatusBadge(invitation)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Role: {invitation.role} • 
                    Sent: {format(new Date(invitation.created_at), 'MMM d, yyyy')} • 
                    Expires: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteInvitation(invitation.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvitationList;
