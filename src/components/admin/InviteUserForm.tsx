
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

      // Insert the invitation record
      const { data: invitation, error } = await supabase
        .from("invitations")
        .insert({
          email: data.email,
          organization_id: organizationId,
          role: data.role,
          token,
          invited_by: user.id,
          expires_at: expires_at.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Get organization name for the email
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single();

      if (orgError) {
        console.error("Error getting organization:", orgError);
        // Continue anyway, it's not critical for the invitation
      }

      // In a real app, we would now send an email with the invite link
      // For now, we'll just show a success message with the token
      console.log(`Invitation created with token: ${token}`);
      console.log(`Invitation link would be: ${window.location.origin}/auth/accept-invite?token=${token}`);

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${data.email}`,
      });

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
  
  // Helper function to generate a random token
  const generateInvitationToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  return (
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
  );
}
