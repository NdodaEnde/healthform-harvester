
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AcceptInviteFormProps {
  token: string;
}

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  useEffect(() => {
    // Fetch invitation details
    const getInvitation = async () => {
      try {
        console.log("Fetching invitation with token:", token);
        
        if (!token || token.trim() === '') {
          console.error("Token is empty or invalid");
          setInvitationError("No valid invitation token provided");
          setLoading(false);
          return;
        }
        
        // Check if invitation exists and is valid
        const { data, error } = await supabase
          .from("invitations")
          .select("*, organizations(name)")
          .eq("token", token)
          .is("accepted_at", null)
          .maybeSingle();

        if (error) {
          console.error("Error fetching invitation:", error);
          
          setInvitationError(
            error.message.includes("not found") || error.code === "PGRST116" || error.code === "22P02"
              ? "This invitation doesn't exist or has already been accepted."
              : `Error loading invitation: ${error.message}`
          );
          
          setLoading(false);
          
          // Additional check if the token was already accepted
          const { data: acceptedData } = await supabase
            .from("invitations")
            .select("accepted_at")
            .eq("token", token)
            .maybeSingle();
              
          if (acceptedData?.accepted_at) {
            setInvitationError("This invitation has already been accepted.");
            // If invitation was already accepted, check if user is already associated with the organization
            checkExistingOrganizationMembership(acceptedData);
          }
          
          return;
        }

        console.log("Invitation data:", data);
        
        // Check if invitation has expired
        if (data && new Date(data.expires_at) < new Date()) {
          setInvitationError("This invitation has expired.");
          setLoading(false);
          return;
        }

        setInvitation(data);
        setEmail(data.email);

        // Check if the user is currently logged in
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          // If logged in, check if the email matches the invitation
          if (sessionData.session.user.email === data.email) {
            // Already logged in with the correct account
            setExistingAccount(true);
            setShowCreateAccount(false);
          } else {
            // Logged in but with a different email
            toast("Account Mismatch", {
              description: `You are logged in as ${sessionData.session.user.email} but this invitation is for ${data.email}. Please sign out first.`,
            });
            setInvitationError("You are logged in with a different email address than the invitation.");
          }
        } else {
          // Not logged in, check if account exists
          try {
            const { error: signInError } = await supabase.auth.signInWithOtp({
              email: data.email,
              options: {
                shouldCreateUser: false
              }
            });
            
            // If error contains "User not found", then the user doesn't exist
            const userExists = !signInError || !signInError.message.includes("User not found");
            setExistingAccount(userExists);
            console.log("User exists check:", userExists);
            
            // Default to sign up form for new users
            setShowCreateAccount(!userExists);
          } catch (error) {
            console.error("Error checking if user exists:", error);
            // If we can't determine, default to showing both options
            setShowCreateAccount(false);
          }
        }

      } catch (error) {
        console.error("Error in getInvitation:", error);
        setInvitationError("Failed to load invitation details.");
      } finally {
        setLoading(false);
      }
    };

    getInvitation();
  }, [token]);

  // This function checks if a user is already part of the organization
  const checkExistingOrganizationMembership = async (invitationData: any) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        // Check if the user is already part of the organization
        const { data: orgUserData } = await supabase
          .from("organization_users")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .eq("organization_id", invitationData.organization_id)
          .maybeSingle();
          
        if (orgUserData) {
          toast.success("You are already a member of this organization");
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      }
    } catch (error) {
      console.error("Error checking organization membership:", error);
    }
  };

  const validatePassword = (pass: string): boolean => {
    if (pass.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showCreateAccount && !validatePassword(password)) {
      return;
    }

    setIsSubmitting(true);

    try {
      let userId;
      let currentSession;

      // Check if the user is already logged in
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session && sessionData.session.user.email === email) {
        // Already logged in with the right account
        userId = sessionData.session.user.id;
        currentSession = sessionData.session;
      } else if (existingAccount && !showCreateAccount) {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Error signing in:", error);
          
          // If the error is about invalid credentials, offer to create an account
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid login credentials");
            setShowCreateAccount(true);
          } else {
            toast.error(error.message);
          }
          
          setIsSubmitting(false);
          return;
        }

        userId = data.user?.id;
        currentSession = data.session;
      } else {
        // Create new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error("Error signing up:", error);
          toast.error(error.message);
          setIsSubmitting(false);
          return;
        }

        userId = data.user?.id;
        currentSession = data.session;
        
        // Check if email confirmation is required
        if (data.session === null && data.user) {
          toast.info("Email Verification Required", {
            description: "We've sent a confirmation email to your address. Please check your inbox and verify your email before continuing."
          });
          
          // Update the invitation to associate it with this user, but don't mark as accepted yet
          if (invitation && userId) {
            await supabase
              .from("invitations")
              .update({
                accepted_at: null // Just update a field we know exists to associate with this user
              })
              .eq("token", token);
          }
          
          setTimeout(() => navigate("/auth"), 2000);
          return;
        }
      }

      if (userId && invitation) {
        console.log("User authenticated with ID:", userId);
        console.log("Accepting invitation with token:", token);
        
        // Ensure the user profile exists
        const { error: profileError } = await supabase.rpc(
          'direct_insert_profile', 
          {
            p_id: userId,
            p_email: email,
            p_full_name: fullName || email.split('@')[0]
          }
        );
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          // Try an alternative approach if the first one fails
          const { error: forceProfileError } = await supabase.rpc(
            'force_insert_profile',
            {
              p_user_id: userId,
              p_email: email,
              p_full_name: fullName || email.split('@')[0]
            }
          );
          
          if (forceProfileError) {
            console.error("Error with force insert profile:", forceProfileError);
          }
        }
        
        // First check if the user is already added to the organization (to avoid duplicates)
        const { data: existingOrgUser } = await supabase
          .from("organization_users")
          .select("*")
          .eq("user_id", userId)
          .eq("organization_id", invitation.organization_id)
          .maybeSingle();

        if (!existingOrgUser) {
          // Add the user to the organization if not already added
          const { error: orgError } = await supabase
            .from("organization_users")
            .insert({
              organization_id: invitation.organization_id,
              user_id: userId,
              role: invitation.role
            });

          if (orgError) {
            console.error("Error adding user to organization:", orgError);
            
            if (orgError.message.includes("foreign key constraint")) {
              toast.error("There was an issue with your user profile. Please contact support.");
            } else {
              toast.error("You were added to the system but there was an issue adding you to the organization.");
            }
            setIsSubmitting(false);
            return;
          }
        }
        
        // Mark the invitation as accepted ONLY after successfully adding to organization
        const { error: updateError } = await supabase
          .from("invitations")
          .update({
            accepted_at: new Date().toISOString()
          })
          .eq("token", token);

        if (updateError) {
          console.error("Error updating invitation:", updateError);
          toast.error("Failed to mark invitation as accepted");
        } else {
          toast.success("Welcome!", {
            description: `You have successfully joined ${invitation.organizations?.name || "the organization"}.`
          });
          
          // IMPORTANT: Force reload instead of just navigate to ensure the organization context is completely refreshed
          // This fixes the invitation loop bug by forcing a full reload of the application state
          setTimeout(() => {
            // Store a flag in localStorage to prevent redirects after the reload
            localStorage.setItem("invitation_just_accepted", "true");
            
            // Perform a hard reload to ensure all contexts are refreshed
            window.location.href = "/dashboard";
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error("Error: " + (error.message || "An error occurred while processing your invitation"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAccountMode = () => {
    setShowCreateAccount(!showCreateAccount);
    setPasswordError(null);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (invitationError || !invitation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{invitationError || "This invitation doesn't exist or has already been accepted."}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Please check that you're using the correct link or contact the person who invited you.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6">
          You've been invited to join{" "}
          <strong>{invitation.organizations?.name || "an organization"}</strong> as a{" "}
          <strong>{invitation.role}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
            />
          </div>

          {showCreateAccount && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (showCreateAccount) {
                  validatePassword(e.target.value);
                }
              }}
              required
              placeholder={showCreateAccount ? "Create a new password" : "Enter your password"}
              className={passwordError ? "border-red-500" : ""}
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
            {showCreateAccount && (
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : showCreateAccount ? (
              "Create Account & Accept Invitation"
            ) : (
              "Sign In & Accept Invitation"
            )}
          </Button>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={toggleAccountMode}
              className="text-sm text-blue-600 hover:underline"
            >
              {showCreateAccount 
                ? "Already have an account? Sign in instead" 
                : "Don't have an account yet? Create one"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
