
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
        
        // Get query parameters
        const queryParams = new URLSearchParams(window.location.search);
        const inviteToken = queryParams.get("token");
        const confirmation = queryParams.get("confirmation");
        
        if (confirmation === "success") {
          toast.success("Email confirmed successfully! You can now sign in.");
        }
        
        if (accessToken && refreshToken) {
          // If we have tokens in the URL, set the session
          console.log("Setting session from URL parameters");
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          } catch (sessionError) {
            console.error("Error setting session:", sessionError);
          }
        }
        
        // Get the current session
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
          console.log("Session authenticated:", data.session.user.email);
          toast.success("Successfully authenticated");
          
          // First check if the user has a profile created - this should happen automatically 
          // thanks to our trigger and deferred foreign key
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();
            
          if (profileError && !profileError.message.includes("No rows found")) {
            console.error("Error checking user profile:", profileError);
            
            // Try to create the profile if the check failed for another reason
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  full_name: data.session.user.email?.split('@')[0] || 'User',
                  updated_at: new Date().toISOString()
                });
              
              if (createError) {
                console.error("Error creating profile directly:", createError);
              }
            } catch (insertError) {
              console.error("Exception during profile creation:", insertError);
            }
          } else if (!profileData) {
            console.log("No profile found, creating one now");
            // Create profile if it doesn't exist
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email,
                  full_name: data.session.user.email?.split('@')[0] || 'User',
                  updated_at: new Date().toISOString()
                });
              
              if (createError) {
                console.error("Error creating profile:", createError);
              }
            } catch (insertError) {
              console.error("Exception during profile creation:", insertError);
            }
          }
          
          // Check for the specific invitation if token is provided
          if (inviteToken) {
            console.log("Processing invite token:", inviteToken);
            const { data: inviteData, error: inviteError } = await supabase
              .from("invitations")
              .select("id, organization_id, token, role")
              .eq("token", inviteToken)
              .is("accepted_at", null)
              .single();
              
            if (inviteError) {
              console.error("Error fetching invitation:", inviteError);
            } else if (inviteData) {
              console.log("Found invitation, navigating to accept invite page");
              navigate(`/accept-invite?token=${inviteToken}`);
              return;
            }
          }
          
          // Check for pending invitations by email
          const { data: invitesByEmail } = await supabase
            .from("invitations")
            .select("id, organization_id, token, role")
            .eq("email", data.session.user.email)
            .is("accepted_at", null);
            
          if (invitesByEmail && invitesByEmail.length > 0) {
            // User has pending invitations, redirect to accept first invitation
            console.log("User has pending invitations, navigating to accept invite");
            navigate(`/accept-invite?token=${invitesByEmail[0].token}`);
            return;
          }
          
          // Check if the user already has an organization
          const { data: orgData } = await supabase
            .from("organization_users")
            .select("organization_id")
            .eq("user_id", data.session.user.id);
            
          if (orgData && orgData.length > 0) {
            // User already has an organization, redirect to dashboard
            console.log("User already has an organization, redirecting to dashboard");
            navigate("/dashboard");
          } else {
            // No organizations and no invitations, go to setup page
            console.log("No organizations or invitations, redirecting to setup");
            navigate("/setup");
          }
        } else {
          setError("No session data found");
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
