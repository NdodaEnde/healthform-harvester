import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface AcceptInviteFormProps {
  token: string;
}

interface Invitation {
  id: string;
  email: string;
  organization_id: string;
  role: string;
  organization?: {
    name: string;
  }
}

export default function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        // Fetch invitation details including the organization name
        const { data, error } = await supabase
          .from("invitations")
          .select(`
            id, 
            email, 
            organization_id, 
            role,
            organizations:organization_id (name)
          `)
          .eq("token", token)
          .is("accepted_at", null)
          .single();

        if (error) {
          throw error;
        }

        // Check if invitation has expired
        const { data: invData, error: invError } = await supabase
          .from("invitations")
          .select("expires_at")
          .eq("token", token)
          .single();

        if (invError) {
          throw invError;
        }

        if (new Date(invData.expires_at) < new Date()) {
          toast({
            title: "Invitation Expired",
            description: "This invitation has expired. Please request a new one.",
            variant: "destructive",
          });
          return;
        }

        setInvitation({
          ...data,
          organization: data.organizations
        });
      } catch (error: any) {
        console.error("Error fetching invitation:", error);
        toast({
          title: "Invalid Invitation",
          description: "This invitation may have been used or doesn't exist.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) {
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already exists
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      
      if (existingUser && existingUser.email !== invitation.email) {
        // User is logged in with a different email
        toast({
          title: "Different Account",
          description: "Please log out first. This invitation is for a different email.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!existingUser) {
        // Create new user account
        const { data, error } = await supabase.auth.signUp({
          email: invitation.email,
          password: password,
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error("Failed to create user account");
        }

        // Add user to organization
        const { error: orgUserError } = await supabase
          .from("organization_users")
          .insert({
            organization_id: invitation.organization_id,
            user_id: data.user.id,
            role: invitation.role
          });

        if (orgUserError) {
          throw orgUserError;
        }
      } else {
        // Existing user - just add to organization if not already a member
        const { data: existingMembership, error: membershipError } = await supabase
          .from("organization_users")
          .select()
          .eq("organization_id", invitation.organization_id)
          .eq("user_id", existingUser.id)
          .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        if (!existingMembership) {
          // Add user to organization
          const { error: orgUserError } = await supabase
            .from("organization_users")
            .insert({
              organization_id: invitation.organization_id,
              user_id: existingUser.id,
              role: invitation.role
            });

          if (orgUserError) {
            throw orgUserError;
          }
        }
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from("invitations")
        .update({
          accepted_at: new Date().toISOString()
        })
        .eq("token", token);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Invitation Accepted",
        description: `You've successfully joined ${invitation.organization?.name}`,
      });

      // Redirect to dashboard
      navigate("/dashboard");

    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This invitation may have been used or doesn't exist.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/auth")}>
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2">
              You've been invited to join <strong>{invitation.organization?.name}</strong> as a <strong>{invitation.role}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Please set a password to create your account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={invitation.email}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Accept & Create Account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
