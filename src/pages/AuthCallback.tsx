import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Starting auth callback process");
        
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        
        // Get query parameters
        const queryParams = new URLSearchParams(window.location.search);
        const inviteToken = queryParams.get("token");
        
        // Check if this is an email confirmation
        // For email confirmations, Supabase typically includes type=signup or recovery
        const isEmailConfirmation = type === "signup" || queryParams.get("confirmation") === "success";
        
        console.log("Auth callback params:", { 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          isEmailConfirmation,
          inviteToken: inviteToken || "none"
        });
        
        if (isEmailConfirmation) {
          console.log("This is an email confirmation callback");
          
          // For email confirmations, redirect to auth page with success param
          // This is better than trying to automatically sign in here
          toast.success("Email verified successfully!");
          navigate("/auth?confirmation=success");
          return;
        }
        
        if (accessToken && refreshToken) {
          // If we have tokens in the URL, set the session
          console.log("Setting session from URL parameters");
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            // Get the current session to confirm it worked
            const { data: sessionData } = await supabase.auth.getSession();
            
            if (sessionData?.session) {
              console.log("Session established after setting tokens");
              
              // Ensure profile exists
              await ensureUserProfile(sessionData.session.user);
              
              // Check for invitations
              if (inviteToken) {
                navigate(`/accept-invite?token=${inviteToken}`);
                return;
              }
              
              // Check for pending invitations by email
              const { data: invitesByEmail } = await supabase
                .from("invitations")
                .select("token")
                .eq("email", sessionData.session.user.email)
                .is("accepted_at", null)
                .limit(1);
                
              if (invitesByEmail && invitesByEmail.length > 0) {
                navigate(`/accept-invite?token=${invitesByEmail[0].token}`);
                return;
              }
              
              // Check if user already has an organization
              const { data: orgData } = await supabase
                .from("organization_users")
                .select("organization_id")
                .eq("user_id", sessionData.session.user.id)
                .limit(1);
                
              if (orgData && orgData.length > 0) {
                navigate("/dashboard");
              } else {
                navigate("/setup");
              }
              return;
            }
          } catch (sessionError) {
            console.error("Error setting session:", sessionError);
          }
        }
        
        // If we reach here without redirecting, there's likely an issue
        // Get the current session one more time to check state
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          toast.error("Authentication failed", {
            description: error.message
          });
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        if (data?.session) {
          // We have a session after all
          console.log("Session found after all checks");
          navigate("/dashboard");
        } else {
          // No session established
          setError("No session could be established");
          navigate("/auth?confirmation=success");
        }
      } catch (err: any) {
        console.error("Unexpected error during authentication:", err);
        setError(err.message || "Authentication failed");
        toast.error("Authentication error", {
          description: "An unexpected error occurred"
        });
        setTimeout(() => navigate("/auth"), 3000);
      }
    };
    
    // Helper function to ensure user profile exists
    const ensureUserProfile = async (user) => {
      if (!user) return;
      
      try {
        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
          
        if (!profileData && (!profileError || !profileError.message.includes("found"))) {
          console.log("Creating user profile");
          
          // Try to create profile
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.email?.split('@')[0] || 'User',
              updated_at: new Date().toISOString()
            });
            
          if (createError) {
            console.error("Error creating profile:", createError);
          }
        }
      } catch (err) {
        console.error("Error ensuring user profile:", err);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="text-center">
          <div className="text-destructive text-2xl mb-4">Authentication Error</div>
          <p className="mb-4">{error}</p>
          <p>Redirecting to login page...</p>
        </div>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-xl">Completing authentication...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your credentials</p>
        </>
      )}
    </div>
  );
}