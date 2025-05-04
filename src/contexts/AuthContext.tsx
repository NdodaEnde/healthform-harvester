
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
    } else {
      console.log("Sign up response:", data);
      
      // Create a profile regardless of email confirmation status
      if (data.user) {
        try {
          console.log("Attempting to create profile for new user:", data.user.id);
          
          // Try direct RPC call first
          const { error: profileError } = await supabase.rpc('direct_insert_profile', {
            p_id: data.user.id,
            p_email: email,
            p_full_name: email.split('@')[0]
          });
          
          if (profileError) {
            console.error("Error creating profile with direct_insert_profile:", profileError);
            
            // Fallback to direct insert
            const { error: insertError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              full_name: email.split('@')[0],
              updated_at: new Date().toISOString()
            });
            
            if (insertError) {
              console.error("Error with direct profile insert:", insertError);
            } else {
              console.log("Profile created successfully via direct insert");
            }
          } else {
            console.log("Profile created successfully via RPC");
          }
          
          // Use the ensure_profile_exists function as another fallback
          const { error: ensureError } = await supabase.rpc('ensure_profile_exists', {
            p_user_id: data.user.id,
            p_email: email,
            p_full_name: email.split('@')[0]
          });
          
          if (ensureError) {
            console.error("Error ensuring profile exists:", ensureError);
          } else {
            console.log("Profile existence ensured");
          }
        } catch (profileErr) {
          console.error("Failed to create profile:", profileErr);
        }
      }
    }
    
    return { data, error };
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
