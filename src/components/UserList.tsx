
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { User, Mail, Shield, Trash2 } from 'lucide-react';

interface UserListProps {
  organizationId: string;
}

interface OrganizationUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

const UserList: React.FC<UserListProps> = ({ organizationId }) => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['organization-users', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          id,
          user_id,
          role,
          created_at,
          users (
            id,
            full_name,
            email,
            avatar_url
          ),
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId as any);

      if (error) throw error;
      return data as OrganizationUser[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole })
        .eq('organization_id', organizationId as any)
        .eq('user_id', userId as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['organization-users', organizationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', organizationId as any)
        .eq('user_id', userId as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User removed",
        description: "User has been successfully removed from the organization.",
      });
      queryClient.invalidateQueries({ queryKey: ['organization-users', organizationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this user from the organization?')) {
      removeUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Organization Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!users || users.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">
              No users are currently part of this organization.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const userProfile = user.users || user.profiles;
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={userProfile?.avatar_url} />
                      <AvatarFallback>
                        {userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{userProfile?.full_name || 'Unknown User'}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {userProfile?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </Badge>
                    
                    <Select 
                      value={user.role} 
                      onValueChange={(newRole) => handleRoleChange(user.user_id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserList;
