
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change event:", event);
        console.log("New session:", currentSession ? "exists" : "none");
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Show UI feedback for important auth events
        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in');
        } else if (event === 'SIGNED_OUT') {
          toast.info('You have been signed out');
        } else if (event === 'USER_UPDATED') {
          toast.success('Your profile has been updated');
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.info('Password recovery initiated');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auth functions
  const signIn = async (email: string, password: string) => {
    console.log("Signing in with:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error("Sign in error:", error);
    } else {
      console.log("Sign in successful");
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log("Signing up with:", email);
    
    // Get the actual deployment URL for better email redirects
    const origin = window.location.origin;
    console.log("Current origin:", origin);
    
    // Generate a redirect URL that will work in production environments
    const redirectTo = `${origin}/auth/callback`;
    
    console.log("Using redirect URL for signup:", redirectTo);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: email.split('@')[0] // Set a default name from email
          }
        }
      });
      
      if (error) {
        console.error("Sign up error:", error);
        return { data: null, error };
      }
      
      console.log("Sign up response:", data);
      
      // For email confirmation mode, we should wait for verification before creating profile
      const emailConfirmRequired = data.session === null && data.user?.identities?.length === 1;
      
      if (data.user && !emailConfirmRequired) {
        // If email confirmation is not required, attempt to create profile right away
        try {
          await createUserProfile(data.user.id, email);
        } catch (profileErr) {
          console.error("Failed to create profile, but sign-up completed:", profileErr);
          // We don't fail the signup if profile creation fails
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error("Unexpected error during signup:", error);
      return { data: null, error };
    }
  };

  // Helper function to create a user profile
  const createUserProfile = async (userId: string, email: string) => {
    const fullName = email.split('@')[0];
    
    // Try using the create_user_profile function if it exists
    try {
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        email: email,
        full_name: fullName
      });
      
      if (!profileError) {
        console.log("Profile created successfully via create_user_profile RPC");
        return;
      }
      console.error("Error with create_user_profile:", profileError);
    } catch (e) {
      console.warn("create_user_profile function might not exist:", e);
    }
    
    // Fallback to direct insert if the function doesn't exist
    try {
      const { error: insertError } = await supabase.from('profiles').insert({
        id: userId,
        email: email,
        full_name: fullName,
        updated_at: new Date().toISOString()
      });
      
      if (!insertError) {
        console.log("Profile created successfully via direct insert");
        return;
      }
      
      console.error("Error with direct profile insert:", insertError);
    } catch (e) {
      console.error("Failed to insert profile directly:", e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/update-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
