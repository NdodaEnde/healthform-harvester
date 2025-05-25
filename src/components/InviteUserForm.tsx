
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateInvitationToken, sendInvitationEmail } from "@/utils/email-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";

interface InviteUserFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export default function InviteUserForm({ organizationId, onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("staff");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to invite users",
          variant: "destructive",
        });
        return;
      }

      // Generate a unique token for this invitation
      const token = generateInvitationToken();
      
      // Set expiration date (7 days from now)
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);

      // Insert the invitation record
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          email,
          organization_id: organizationId,
          role,
          token,
          invited_by: user.id,
          expires_at: expires_at.toISOString()
        } as any);

      if (error) {
        throw error;
      }

      // Get organization name for the email
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId as any)
        .single();

      if (orgError) {
        console.error("Error getting organization:", orgError);
        // Continue anyway, it's not critical for the invitation
      }

      // Send invitation email
      const organizationName = (org && typeof org === 'object' && 'name' in org) ? org.name as string : "HealthForm Harvester";
      const { success, error: emailError } = await sendInvitationEmail(email, organizationName, token);
      
      if (!success && emailError) {
        console.warn("Email sending warning:", emailError);
        toast({
          title: "Warning",
          description: `Invitation created but email delivery failed. You may need to send the invitation link manually.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${email}`,
        });
      }

      // Clear the form
      setEmail("");
      setRole("staff");
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Invite a Team Member</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="staff">Staff Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
