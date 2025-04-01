
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import React from 'react';

export type UserRole = 'admin' | 'clinician' | 'staff' | 'client';

// Cache the user roles to avoid excessive database queries
const userRoleCache = new Map<string, UserRole>();

/**
 * Gets the role of the specified user
 * Returns the highest privilege role if user has multiple roles
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  // Check cache first
  if (userRoleCache.has(userId)) {
    return userRoleCache.get(userId) as UserRole;
  }
  
  // Query the organization_users table to get the user's roles
  const { data, error } = await supabase
    .from('organization_users')
    .select('role')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user role:', error);
    return 'staff'; // Default to staff if there's an error
  }
  
  // If no roles found, default to staff
  if (!data || data.length === 0) {
    return 'staff';
  }
  
  // Get the highest privilege role
  // Priority: admin > clinician > staff > client
  let highestRole: UserRole = 'client';
  
  for (const roleData of data) {
    const currentRole = roleData.role as string;
    
    if (currentRole === 'admin' || currentRole === 'superadmin') {
      highestRole = 'admin';
      break; // Admin is highest, no need to check further
    } else if (currentRole === 'clinician' && highestRole !== 'admin') {
      highestRole = 'clinician';
    } else if (currentRole === 'staff' && highestRole !== 'admin' && highestRole !== 'clinician') {
      highestRole = 'staff';
    }
  }
  
  // Cache the result
  userRoleCache.set(userId, highestRole);
  
  return highestRole;
};

/**
 * Hook to get the current user's role
 */
export const useUserRole = (): { role: UserRole | null, loading: boolean } => {
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  
  React.useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const userRole = await getUserRole(data.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRole();
  }, []);
  
  return { role, loading };
};
