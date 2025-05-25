
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw } from "lucide-react";
import { format, isAfter } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  token?: string;
}

interface InvitationListProps {
  organizationId: string;
  onRefresh?: () => void;
}

export default function InvitationList({ organizationId, onRefresh }: InvitationListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      // Only fetch invitations that haven't been accepted
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("organization_id", organizationId as any)
        .is("accepted_at", null) // This ensures we only get pending invitations
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const typedInvitations: Invitation[] = (data || [])
        .filter((invitation): invitation is NonNullable<typeof invitation> => 
          invitation !== null && typeof invitation === 'object' && 'id' in invitation
        )
        .map(invitation => ({
          id: String(invitation.id || ''),
          email: String(invitation.email || ''),
          role: String(invitation.role || ''),
          created_at: String(invitation.created_at || ''),
          expires_at: String(invitation.expires_at || ''),
          accepted_at: invitation.accepted_at,
          token: invitation.token || undefined
        }));
      
      setInvitations(typedInvitations);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchInvitations();
    }
  }, [organizationId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id as any);

      if (error) {
        throw error;
      }

      // Update the local state
      setInvitations(invitations.filter(inv => inv.id !== id));
      
      toast({
        title: "Invitation Deleted",
        description: "The invitation has been deleted successfully",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      });
    }
  };

  const handleResend = async (invitation: Invitation) => {
    try {
      // Update the expiration date
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);

      const { error } = await supabase
        .from("invitations")
        .update({
          expires_at: expires_at.toISOString()
        } as any)
        .eq("id", invitation.id as any);

      if (error) {
        throw error;
      }

      // Get organization name
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId as any)
        .single();

      if (orgError) {
        console.error("Error getting organization:", orgError);
      }

      // In a real app, we would now send a new email with the invite link
      // For demonstration purposes, we'll log the information
      console.log(`Invitation resent to ${invitation.email}`);
      
      // Generate the invitation link - check if token exists first
      if (invitation.token) {
        console.log(`Invitation link would be: ${window.location.origin}/auth/accept-invite?token=${invitation.token}`);
      } else {
        // If no token is available, we'll need to fetch the full invitation
        const { data, error: fetchError } = await supabase
          .from("invitations")
          .select("token")
          .eq("id", invitation.id as any)
          .single();
          
        if (fetchError) {
          console.error("Error getting invitation token:", fetchError);
        } else if (data && 'token' in data && data.token) {
          console.log(`Invitation link would be: ${window.location.origin}/auth/accept-invite?token=${data.token}`);
        }
      }
      
      toast({
        title: "Invitation Resent",
        description: `The invitation to ${invitation.email} has been resent`,
      });
      
      // Refresh the list
      fetchInvitations();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return !isAfter(new Date(expiresAt), new Date());
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge className="bg-green-600 text-white">Accepted</Badge>;
    }
    
    if (isExpired(invitation.expires_at)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (loading) {
    return <div className="py-4 text-center">Loading invitations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Pending Invitations</span>
          <Button variant="outline" size="sm" onClick={fetchInvitations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No pending invitations
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div 
                key={invitation.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <div className="font-medium">{invitation.email}</div>
                  <div className="text-sm text-muted-foreground flex items-center space-x-2">
                    <span>Role: {invitation.role}</span>
                    <span>•</span>
                    <span>Sent: {format(new Date(invitation.created_at), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    {getStatusBadge(invitation)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!invitation.accepted_at && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResend(invitation)}
                        disabled={!isExpired(invitation.expires_at)}
                      >
                        Resend
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
