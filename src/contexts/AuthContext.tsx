
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
    console.log("Signing up with email:", email);
    
    // Get the actual deployment URL for better email redirects
    const origin = window.location.origin;
    console.log("Current origin:", origin);
    
    // Generate a redirect URL that will work in production environments
    const redirectTo = `${origin}/auth/callback`;
    
    console.log("Using redirect URL for signup:", redirectTo);
    
    try {
      // First, attempt to sign up the user
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
      
      // Check if email confirmation is required
      const emailConfirmRequired = data.session === null && data.user;
      
      if (emailConfirmRequired) {
        console.log("Email confirmation is required. A confirmation email has been sent.");
        
        // This is important: we do NOT try to sign in or create a profile here
        // The user must first verify their email by clicking the link
        return { data, error: null };
      }
      
      // If email confirmation is not required (rare in production)
      // we can create a profile and continue with the process
      if (data.user && data.session) {
        console.log("Email confirmation not required. User created with session.");
        
        try {
          // Try to create a profile for the user using type casting
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: email.split('@')[0] || 'User',
              updated_at: new Date().toISOString()
            } as any);
            
          if (profileError) {
            console.warn("Non-critical error creating profile:", profileError);
            // Continue anyway - profile will be created later if needed
          }
          
          // Set flag for new account
          localStorage.setItem("just_created_account", "true");
        } catch (profileErr) {
          console.warn("Error attempting to create profile:", profileErr);
          // Continue anyway - this error shouldn't block the signup process
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error("Unexpected error during signup:", error);
      return { data: null, error };
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
