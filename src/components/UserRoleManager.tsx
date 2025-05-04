
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, Trash2, User, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

interface UserRoleManagerProps {
  organizationId: string;
}

export default function UserRoleManager({ organizationId }: UserRoleManagerProps) {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const fetchUsers = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // First get the current user's info so we can prevent self-deletion
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }

      // Get organization users
      const { data: organizationUsers, error } = await supabase
        .from("organization_users")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get emails from profiles table
      const userIds = organizationUsers?.map(ou => ou.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
        
      if (profilesError) throw profilesError;

      // Combine organization users with profiles
      const usersWithEmail = organizationUsers?.map(orgUser => {
        const profile = profiles?.find(p => p.id === orgUser.user_id);
        return {
          ...orgUser,
          email: profile?.email || "Unknown Email"
        };
      }) || [];

      setUsers(usersWithEmail);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
  }, [organizationId]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("organization_users")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("organization_id", organizationId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map(user => 
          user.user_id === userId 
            ? { ...user, role: newRole } 
            : user
        )
      );

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const removeUser = async (userId: string, userEmail: string) => {
    // Prevent removing yourself
    if (userEmail === currentUserEmail) {
      toast({
        title: "Cannot Remove Yourself",
        description: "You cannot remove your own account from the organization",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove ${userEmail} from this organization?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("organization_users")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", organizationId);

      if (error) throw error;

      // Update local state
      setUsers(users.filter(user => user.user_id !== userId));

      toast({
        title: "User Removed",
        description: "User has been removed from the organization",
      });
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Organization Members</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No users found in this organization
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {user.email}
                      {user.email === currentUserEmail && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateUserRole(user.user_id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="staff">Staff Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUser(user.user_id, user.email || "")}
                      disabled={user.email === currentUserEmail}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
