
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

// Define allowed organization types explicitly to match database constraint
type OrganizationType = 'service_provider' | 'client';

interface OrganizationData {
  id?: string;
  name: string;
  organization_type: string;
  contact_email?: string;
  is_active?: boolean;
}

interface OrganizationFormProps {
  organization?: OrganizationData;
  isEdit?: boolean;
}

export default function OrganizationForm({ organization, isEdit = false }: OrganizationFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentOrganization } = useOrganization();
  
  const [name, setName] = useState(organization?.name || "");
  const [organizationType, setOrganizationType] = useState<OrganizationType>(
    (organization?.organization_type as OrganizationType) || "client"
  );
  const [contactEmail, setContactEmail] = useState(organization?.contact_email || "");
  const [isActive, setIsActive] = useState(organization?.is_active !== false);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!name.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a name for the organization",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formData = {
        name: name.trim(),
        organization_type: organizationType,
        contact_email: contactEmail?.trim() || null,
        is_active: isEdit ? isActive : true
      };
      
      console.log("Submitting organization data:", formData);
      
      if (isEdit && organization?.id) {
        // Update existing organization
        const { error } = await supabase
          .from("organizations")
          .update(formData as any)
          .eq("id", organization.id as any);
          
        if (error) throw error;
        
        toast({
          title: "Organization updated",
          description: "Organization has been updated successfully",
        });
      } else {
        // Check if we're creating a client organization from a service provider
        if (organizationType === "client" && currentOrganization?.organization_type === "service_provider") {
          console.log("Creating client organization via RPC function");
          
          const { data: newClientId, error } = await supabase.rpc(
            "create_client_organization",
            {
              org_name: name.trim(),
              org_email: contactEmail?.trim() || null
            }
          );
            
          if (error) throw error;
          
          console.log("Client organization created with ID:", newClientId);
          
          toast({
            title: "Client organization created",
            description: "Client organization has been created and linked to your service provider",
          });
        } else {
          console.log("Creating regular organization");
          
          const { data: newOrg, error } = await supabase
            .from("organizations")
            .insert(formData as any)
            .select()
            .single();
            
          if (error) throw error;
          
          console.log("Regular organization created:", newOrg);
          
          toast({
            title: "Organization created",
            description: "Organization has been created successfully",
          });
        }
      }
      
      // Redirect back to organizations list
      navigate("/admin/organizations");
    } catch (error: any) {
      console.error("Error saving organization:", error);
      
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} organization: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit' : 'Create'} Organization</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input 
              id="name"
              placeholder="Enter organization name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="organization_type">Organization Type</Label>
            <Select 
              value={organizationType}
              onValueChange={(value: OrganizationType) => setOrganizationType(value)}
              disabled={isEdit} // Can't change type after creation
            >
              <SelectTrigger id="organization_type">
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input 
              id="contact_email"
              type="email" 
              placeholder="contact@example.com" 
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          
          {isEdit && (
            <div className="flex items-center space-x-2">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="font-normal">Active</Label>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/admin/organizations")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Organization' : 'Create Organization'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
