
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

interface UserManagementListProps {
  users: User[];
  organizationId: string;
  onUpdate?: (users: User[]) => void;
}

export default function UserManagementList({ users, organizationId, onUpdate }: UserManagementListProps) {
  const [usersList, setUsersList] = useState<User[]>(users);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    async function fetchCurrentUser() {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    }
    
    fetchCurrentUser();
  }, []);
  
  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("organization_users")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("organization_id", organizationId);
        
      if (error) throw error;
      
      const updatedUsers = usersList.map(user => 
        user.user_id === userId ? { ...user, role: newRole } : user
      );
      
      setUsersList(updatedUsers);
      if (onUpdate) onUpdate(updatedUsers);
      
      toast({
        title: "Role updated",
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
  
  const removeUser = async (id: string, userId: string) => {
    // Prevent removing yourself
    if (userId === currentUser?.id) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove your own account from the organization",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from("organization_users")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      const updatedUsers = usersList.filter(user => user.id !== id);
      setUsersList(updatedUsers);
      if (onUpdate) onUpdate(updatedUsers);
      
      toast({
        title: "User removed",
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
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usersList.length > 0 ? (
          usersList.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email || "Unknown"}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
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
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeUser(user.id, user.user_id)}
                  disabled={user.user_id === currentUser?.id}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
