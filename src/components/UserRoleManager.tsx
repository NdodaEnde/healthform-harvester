import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface OrganizationUser {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  full_name?: string;
  created_at: string;
}

interface UserRoleManagerProps {
  organizationId?: string;
}

const UserRoleManager: React.FC<UserRoleManagerProps> = ({ organizationId }) => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const orgId = organizationId || currentOrganization?.id;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      if (!orgId) return;

      // First get organization users
      const { data: orgUsers, error: orgError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('organization_id', orgId as any);

      if (orgError) throw orgError;

      // Handle case where orgUsers might be null or not an array
      if (!orgUsers || !Array.isArray(orgUsers)) {
        setUsers([]);
        return;
      }

      // Then get user profiles for additional info
      const userIds = orgUsers.map((ou: any) => ou.user_id);
      
      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Continue without profile data
      }

      // Merge the data with proper typing and error handling
      const usersWithProfiles: OrganizationUser[] = orgUsers.map((orgUser: any) => {
        const profile = Array.isArray(profiles) ? profiles.find((p: any) => p && p.id === orgUser.user_id) : null;
        return {
          id: orgUser.id || '',
          user_id: orgUser.user_id || '',
          role: orgUser.role || '',
          created_at: orgUser.created_at || '',
          email: (profile as any)?.email || undefined,
          full_name: (profile as any)?.full_name || undefined
        };
      });

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [orgId]);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      if (!orgId) return;

      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole } as any)
        .eq('user_id', userId as any)
        .eq('organization_id', orgId as any);

      if (error) throw error;
      
      toast.success('User role updated successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      if (!orgId) return;

      if (!confirm('Are you sure you want to remove this user from the organization?')) {
        return;
      }

      const { error } = await supabase
        .from('organization_users')
        .delete()
        .eq('user_id', userId as any)
        .eq('organization_id', orgId as any);

      if (error) throw error;
      
      toast.success('User removed from organization');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          User Management ({users.length})
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions for this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Users</h3>
            <p className="text-muted-foreground">
              No users are currently assigned to this organization.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {user.full_name || user.email || 'Unknown User'}
                    </span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  {user.email && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {user.email}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Added: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => updateUserRole(user.user_id, newRole)}
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
                    onClick={() => removeUser(user.user_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRoleManager;
