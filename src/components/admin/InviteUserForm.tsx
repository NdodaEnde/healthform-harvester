
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
      // TODO: Replace with actual invitation logic
      // For now, we'll just create a mock response
      
      // Mock successful invitation
      console.log("Inviting user:", data.email, "with role:", data.role, "to organization:", organizationId);
      
      toast({
        title: "Invitation sent",
        description: `Invitation has been sent to ${data.email}`,
      });
      
      // Call callbacks with mock data
      const mockUser = {
        id: `temp-${Date.now()}`,
        email: data.email,
        role: data.role,
        user_id: `temp-user-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      
      if (onInvite) {
        onInvite(mockUser);
      }
      
      if (onUserAdded) {
        onUserAdded(mockUser);
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
