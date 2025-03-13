
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  users?: {
    email: string;
  };
}

interface UserTableProps {
  users: User[];
  organizationId: string;
  onUserUpdated: () => void;
}

export default function UserTable({ users, organizationId, onUserUpdated }: UserTableProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    
    getUser();
  }, []);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("organization_users")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("organization_id", organizationId);
        
      if (error) throw error;
      
      toast({
        title: "Role updated",
        description: "User role has been updated successfully",
      });
      
      if (onUserUpdated) onUserUpdated();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };
  
  const removeUser = async (userId: string) => {
    // Prevent removing yourself
    if (userId === currentUser?.id) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove your own account from the organization",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Are you sure you want to remove this user from the organization?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("organization_users")
        .delete()
        .eq("user_id", userId)
        .eq("organization_id", organizationId);
        
      if (error) throw error;
      
      toast({
        title: "User removed",
        description: "User has been removed from the organization",
      });
      
      if (onUserUpdated) onUserUpdated();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Since</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.users?.email || "Unknown Email"}
                {user.user_id === currentUser?.id && (
                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                )}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value) => updateUserRole(user.user_id, value)}
                  disabled={user.user_id === currentUser?.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={user.user_id === currentUser?.id}
                  onClick={() => removeUser(user.user_id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-10 text-gray-500">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
