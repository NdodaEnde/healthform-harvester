
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'clinician' | 'staff' | 'client';

// Cache the user roles to avoid excessive database queries
const userRoleCache = new Map<string, UserRole>();

/**
 * Gets the role of the specified user
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  // Check cache first
  if (userRoleCache.has(userId)) {
    return userRoleCache.get(userId) as UserRole;
  }
  
  // Query the organization_users table to get the user's role
  const { data, error } = await supabase
    .from('organization_users')
    .select('role')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user role:', error);
    return 'staff'; // Default to staff if there's an error
  }
  
  // Map the database role to our UserRole type
  let role: UserRole = 'staff';
  
  if (data?.role === 'admin' || data?.role === 'superadmin') {
    role = 'admin';
  } else if (data?.role === 'clinician') {
    role = 'clinician';
  } else if (data?.role === 'client') {
    role = 'client';
  }
  
  // Cache the result
  userRoleCache.set(userId, role);
  
  return role;
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

// Import at the top
import React from 'react';
