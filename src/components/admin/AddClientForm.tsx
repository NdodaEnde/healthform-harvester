
import { useState } from "react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { Organization } from "@/types/organization";

interface AddClientFormProps {
  serviceProviderId: string;
  potentialClients: Organization[];
  onClientAdded: () => void;
}

export default function AddClientForm({ 
  serviceProviderId, 
  potentialClients, 
  onClientAdded 
}: AddClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      clientId: "",
      startDate: new Date().toISOString().split("T")[0]
    }
  });
  
  const onSubmit = async (data: { clientId: string; startDate: string }) => {
    if (!data.clientId) {
      toast({
        title: "Client required",
        description: "Please select a client organization",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("organization_relationships")
        .insert({
          service_provider_id: serviceProviderId,
          client_id: data.clientId,
          relationship_start_date: data.startDate,
          is_active: true
        });
        
      if (error) throw error;
      
      toast({
        title: "Client added",
        description: "Client relationship has been created successfully",
      });
      
      // Reset the form
      form.reset({
        clientId: "",
        startDate: new Date().toISOString().split("T")[0]
      });
      
      // Refresh the client lists
      if (onClientAdded) onClientAdded();
    } catch (error: any) {
      console.error("Error adding client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatOrgType = (type: string) => {
    switch (type) {
      case "direct_client":
        return "Direct Client";
      case "client":
        return "Client";
      default:
        return type;
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Client Organization</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {potentialClients.length > 0 ? (
                    potentialClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} ({formatOrgType(client.organization_type)})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No available clients
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit"
          className="w-full"
          disabled={isSubmitting || potentialClients.length === 0}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">Adding</span>
              <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            "Add Client"
          )}
        </Button>
        
        {potentialClients.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            No available clients to add. Create new organizations first.
          </p>
        )}
      </form>
    </Form>
  );
}
