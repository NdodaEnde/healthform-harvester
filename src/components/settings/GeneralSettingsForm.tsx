
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Organization } from "@/types/organization";

const formSchema = z.object({
  name: z.string().min(2, { message: "Organization name is required" }),
  contact_email: z.string().email({ message: "Invalid email address" }).optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneralSettingsFormProps {
  organization: Organization;
  onUpdate: (data: Partial<Organization>) => Promise<boolean>;
}

export default function GeneralSettingsForm({ organization, onUpdate }: GeneralSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
      contact_email: organization?.contact_email || "",
      contact_phone: organization?.contact_phone || "",
      industry: organization?.industry || "",
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const success = await onUpdate(data);
      
      if (success) {
        // Update form values with the new data
        form.reset(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                What industry or sector does your organization operate in?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Form>
  );
}
