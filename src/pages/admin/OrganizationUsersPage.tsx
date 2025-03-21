
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import UserTable from "@/components/admin/UserTable";
import InviteUserForm from "@/components/admin/InviteUserForm";
import { Organization } from "@/types/organization";
import InvitationList from "@/components/InvitationList";

interface OrgUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

export default function OrganizationUsersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchOrganization();
      fetchUsers();
    }
  }, [id]);
  
  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) throw error;
      setOrganization(data);
    } catch (error: any) {
      console.error("Error fetching organization:", error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive",
      });
    }
  };
  
  const fetchUsers = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Get organization users with user emails from profiles table
      const { data: orgUsers, error: orgUsersError } = await supabase
        .from("organization_users")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("organization_id", id);
        
      if (orgUsersError) throw orgUsersError;
      
      if (orgUsers && orgUsers.length > 0) {
        // Fetch emails from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", orgUsers.map(user => user.user_id));
          
        if (profilesError) throw profilesError;
        
        // Map profiles to users
        const usersWithProfiles = orgUsers.map(user => {
          const profile = profiles?.find(p => p.id === user.user_id);
          return {
            ...user,
            email: profile?.email || `Unknown (${user.user_id.slice(0, 8)})`
          };
        });
        
        setUsers(usersWithProfiles);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Error fetching organization users:", error);
      toast({
        title: "Error",
        description: "Failed to load organization users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUserAdded = (newUser: OrgUser) => {
    setUsers([...users, newUser]);
  };

  const handleRefresh = () => {
    fetchUsers();
  };
  
  return (
    <div className="container py-10">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/admin/organizations")}
      >
        <ArrowLeft size={16} /> Back to Organizations
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {organization ? organization.name : "Organization"} - Users
        </h1>
        {organization && (
          <p className="text-gray-500 mt-1">
            Manage users and permissions for this organization
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                All users who have access to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <UserTable 
                  users={users} 
                  organizationId={id || ""}
                  onUserUpdated={fetchUsers}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Invitation List */}
          <InvitationList 
            organizationId={id || ""} 
            onRefresh={handleRefresh}
          />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invite User</CardTitle>
              <CardDescription>
                Send an invitation to join this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteUserForm 
                organizationId={id || ""} 
                onUserAdded={handleUserAdded}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
