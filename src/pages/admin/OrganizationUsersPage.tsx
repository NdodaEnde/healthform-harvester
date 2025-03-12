
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import UserManagementList from "@/components/admin/UserManagementList";
import InviteUserForm from "@/components/admin/InviteUserForm";
import { toast } from "@/components/ui/use-toast";

export default function OrganizationUsersPage() {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrganizationData() {
      setLoading(true);
      try {
        if (!id) {
          throw new Error("No organization ID provided");
        }
        
        // Fetch organization details
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", id)
          .single();
          
        if (orgError) throw orgError;
        setOrganization(org);
        
        // Fetch organization users
        const { data: usersData, error: usersError } = await supabase
          .from("organization_users")
          .select(`
            id,
            user_id,
            role,
            created_at,
            profile:user_id (email)
          `)
          .eq("organization_id", id);
          
        if (usersError) throw usersError;
        setUsers(usersData || []);
      } catch (error: any) {
        console.error("Error fetching organization data:", error);
        toast({
          title: "Error",
          description: "Failed to load organization users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganizationData();
  }, [id]);
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        {loading 
          ? "Loading..." 
          : organization 
            ? `${organization.name} - User Management` 
            : "Organization not found"}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-r-transparent rounded-full"></div>
                </div>
              ) : (
                <UserManagementList 
                  users={users} 
                  organizationId={id || ""}
                  onUpdate={(updatedUsers) => setUsers(updatedUsers)}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invite User</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteUserForm 
                organizationId={id || ""} 
                onInvite={(newUser) => setUsers([...users, newUser])}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
