
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
      // Get organization users with user emails from auth.users
      // We use RPC for this since we can't directly query auth.users
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
      
      // Fetch the user emails separately from auth using admin functions or user info
      // In a production app, this would typically be done server-side or via edge functions
      
      const processedUsers: OrgUser[] = [];
      
      // Process each user to get their email
      for (const orgUser of orgUsers) {
        try {
          // Try to get user email using auth.getUser (works if current user has necessary permissions)
          const { data } = await supabase.auth.admin.getUserById(orgUser.user_id);
          
          processedUsers.push({
            ...orgUser,
            email: data?.user?.email || `user-${orgUser.user_id.slice(0, 8)}@example.com`
          });
        } catch (error) {
          console.error("Error fetching user email:", error);
          // Fallback to placeholder if we can't get the real email
          processedUsers.push({
            ...orgUser,
            email: `user-${orgUser.user_id.slice(0, 8)}@example.com`
          });
        }
      }
      
      setUsers(processedUsers);
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
          <Card>
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
