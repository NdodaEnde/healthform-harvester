import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, ArrowRight } from "lucide-react";

export function PendingInvitationsCard() {
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadInvitations = async () => {
      if (!user?.email) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("invitations")
          .select("*, organizations:organization_id(*)")
          .eq("email", user.email)
          .is("accepted_at", null);
          
        if (error) throw error;
        setPendingInvitations(data || []);
      } catch (error) {
        console.error("Error loading invitations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInvitations();
  }, [user]);
  
  // If no user, don't render
  if (!user) {
    return null;
  }
  
  // In the setup page, we do want to show a message even if there are no invitations
  // In other contexts, we can hide if there are no invitations
  const isSetupPage = window.location.pathname === "/setup";
  if (pendingInvitations.length === 0 && !loading && !isSetupPage) {
    return null;
  }
  
  const handleAcceptInvite = (token: string) => {
    navigate(`/accept-invite?token=${token}`);
  };
  
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-amber-500" />
          <span>Pending Invitations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
          </div>
        ) : pendingInvitations.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              {window.location.pathname === "/setup" 
                ? "You don't have any pending invitations. Create your own organization below."
                : "You don't have any pending invitations."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''} to join organization{pendingInvitations.length !== 1 ? 's' : ''}:
            </p>
            
            <div className="space-y-2">
              {pendingInvitations.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-800 border">
                  <div>
                    <p className="font-medium">{invite.organizations?.name || "Unknown Organization"}</p>
                    <p className="text-sm text-muted-foreground">Invited on {new Date(invite.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleAcceptInvite(invite.token)}
                    className="flex items-center gap-1"
                  >
                    <span>Accept</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}