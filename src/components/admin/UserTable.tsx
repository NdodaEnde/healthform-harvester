
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
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

interface UserTableProps {
  users: User[];
  organizationId: string;
  onUserUpdated: () => void;
}

export default function UserTable({ users, organizationId, onUserUpdated }: UserTableProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
      setIsLoading(true);
      const { error } = await supabase
        .from("organization_users")
        .update({ role: newRole } as any)
        .eq("user_id", userId as any)
        .eq("organization_id", organizationId as any);
        
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
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      const { error } = await supabase
        .from("organization_users")
        .delete()
        .eq("user_id", userId as any)
        .eq("organization_id", organizationId as any);
        
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
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {isLoading && (
        <div className="flex justify-center my-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
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
                  {user.email || "Unknown Email"}
                  {user.user_id === currentUser?.id && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) => updateUserRole(user.user_id, value)}
                    disabled={user.user_id === currentUser?.id || isLoading}
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
                    disabled={user.user_id === currentUser?.id || isLoading}
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
    </div>
  );
}
