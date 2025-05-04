
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
      
      // Important: With Supabase's behavior, we need to wait for the user to confirm their email
      // The auth.users record won't exist until the email is confirmed, which prevents profile creation
      
      // Check if email confirmation is required (the typical case)
      const emailConfirmRequired = data.session === null && data.user;
      
      if (emailConfirmRequired) {
        console.log("Email confirmation is required. A confirmation email has been sent.");
        // Return early without trying to create a profile yet
        return { data, error: null };
      }
      
      // In the rare case where email confirmation is disabled, user is immediately created
      // and we can attempt to create a profile
      if (data.user && data.session) {
        console.log("Email confirmation not required. Creating profile for user:", data.user.id);
        try {
          // We use the handle_new_user trigger function which should create the profile
          // automatically, but just in case, we'll make a direct attempt too
          await createUserProfileSafe(data.user.id, email);
        } catch (profileError) {
          console.error("Failed to create profile, but sign-up completed:", profileError);
          // We don't fail the signup if profile creation fails
        }
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error("Unexpected error during signup:", error);
      return { data: null, error };
    }
  };

  // Helper function for safer profile creation
  const createUserProfileSafe = async (userId: string, email: string) => {
    const fullName = email.split('@')[0];
    console.log("Attempting to create profile for new user:", userId);
    
    // First try: Use the create_user_profile function
    try {
      const { error } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        email: email,
        full_name: fullName
      });
      
      if (!error) {
        console.log("Profile created successfully via create_user_profile RPC");
        return;
      }
      
      console.error("Error with create_user_profile:", error);
    } catch (e) {
      console.warn("create_user_profile function might not exist:", e);
    }

    // Second try: Use the handle_new_user trigger directly
    // We don't actually need to do this manually since the trigger should fire automatically
    // This is just a fallback
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
