
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateInvitationToken, sendInvitationEmail } from "@/utils/email-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "staff", "viewer"])
});

type FormValues = z.infer<typeof formSchema>;

interface InviteUserFormProps {
  organizationId: string;
  onInvite?: (newUser: any) => void;
  onUserAdded?: (newUser: any) => void;
}

export default function InviteUserForm({ organizationId, onInvite, onUserAdded }: InviteUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualInvite, setShowManualInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "staff"
    }
  });
  
  const onSubmit = async (data: FormValues) => {
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

      console.log("Creating invitation with:", {
        email: data.email,
        organizationId,
        role: data.role,
        token,
        invited_by: user.id
      });

      // Check if an invitation already exists for this email and organization
      const { data: existingInvite, error: checkError } = await supabase
        .from("invitations")
        .select("id")
        .eq("email", data.email as any)
        .eq("organization_id", organizationId as any)
        .is("accepted_at", null)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking for existing invitation:", checkError);
      }
      
      if (existingInvite && 'id' in existingInvite) {
        // Delete the existing invitation to prevent duplicates
        await supabase
          .from("invitations")
          .delete()
          .eq("id", existingInvite.id);
          
        console.log("Deleted existing invitation for this email");
      }

      // Insert the invitation record
      const { data: invitation, error } = await supabase
        .from("invitations")
        .insert({
          email: data.email,
          organization_id: organizationId,
          role: data.role,
          token: token,
          invited_by: user.id,
          expires_at: expires_at.toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating invitation:", error);
        throw error;
      }

      if (!invitation || !('id' in invitation)) {
        throw new Error("Failed to create invitation");
      }

      console.log("Created invitation:", invitation);

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

      // Send the invitation email
      const organizationName = (org && 'name' in org) ? org.name : "HealthForm Harvester";
      const emailResult = await sendInvitationEmail(data.email, organizationName, token);
      
      if (!emailResult.success) {
        console.warn("Email sending warning:", emailResult.error);
        
        // Check if we should show manual invite dialog
        if (emailResult.manualSharing || emailResult.inviteUrl) {
          setInviteUrl(emailResult.inviteUrl || "");
          setShowManualInvite(true);
        } else {
          toast({
            title: "Warning",
            description: `Invitation created but email delivery failed. You may need to send the invitation link manually.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${data.email}`,
        });
      }

      // Create a mock user record to update the UI
      const newUser = {
        id: invitation.id,
        user_id: `pending-${Date.now()}`,
        email: data.email,
        role: data.role,
        created_at: new Date().toISOString()
      };
      
      // Call callbacks with the new invitation
      if (onInvite) {
        onInvite(newUser);
      }
      
      if (onUserAdded) {
        onUserAdded(newUser);
      }
      
      form.reset();
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
  
  const copyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied",
      description: "Invitation link copied to clipboard",
    });
  };
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="colleague@example.com" 
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Admin:</strong> Can manage users and settings</p>
            <p><strong>Staff:</strong> Can upload and process documents</p>
            <p><strong>Viewer:</strong> Can only view documents</p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
                Sending...
              </span>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </form>
      </Form>
      
      <AlertDialog open={showManualInvite} onOpenChange={setShowManualInvite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manual Invitation Required</AlertDialogTitle>
            <AlertDialogDescription>
              The invitation has been created, but email delivery isn't available. 
              Please copy and share this invitation link with the user manually:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-muted p-3 rounded-md flex items-center gap-2 mt-2 overflow-auto">
            <code className="text-sm flex-1 break-all">{inviteUrl}</code>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={copyInviteUrl} 
              className="shrink-0"
            >
              <Link size={14} className="mr-1" /> Copy
            </Button>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={copyInviteUrl}>Copy Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
