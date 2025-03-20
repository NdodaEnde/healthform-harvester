
import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Organization } from "@/types/organization";
import GeneralSettingsForm from "@/components/settings/GeneralSettingsForm";
import BrandingSettingsForm from "@/components/settings/BrandingSettingsForm";
import AddressSettingsForm from "@/components/settings/AddressSettingsForm";

export default function OrganizationSettingsPage() {
  const { currentOrganization } = useOrganization();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchOrganization() {
      if (!currentOrganization?.id) {
        setError("No organization selected");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch organization details to get the most up-to-date data
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", currentOrganization.id)
          .single();
          
        if (error) throw error;
        
        setOrganization(data as Organization);
      } catch (error: any) {
        console.error("Error fetching organization:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganization();
  }, [currentOrganization]);
  
  const handleUpdateOrganization = async (updatedData: Partial<Organization>) => {
    if (!organization?.id) return false;
    
    try {
      console.log("Updating organization with data:", updatedData);
      
      // Use update() for organization data
      const { error } = await supabase
        .from("organizations")
        .update(updatedData)
        .eq("id", organization.id);
        
      if (error) throw error;
      
      // Refetch the organization to get the updated data
      const { data: refreshedData, error: refreshError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organization.id)
        .single();
        
      if (refreshError) throw refreshError;
      
      // Update local state
      setOrganization(refreshedData as Organization);
      
      toast({
        title: "Settings saved",
        description: "Organization settings have been updated",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
      return false;
    }
  };
  
  if (loading) {
    return (
      <div className="container py-10 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error || !organization) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-500">{error || "Failed to load organization"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>Manage your organization settings and branding</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <GeneralSettingsForm 
                organization={organization} 
                onUpdate={handleUpdateOrganization} 
              />
            </TabsContent>
            
            <TabsContent value="branding">
              <BrandingSettingsForm 
                organization={organization}
                onUpdate={handleUpdateOrganization}
              />
            </TabsContent>
            
            <TabsContent value="address">
              <AddressSettingsForm 
                organization={organization}
                onUpdate={handleUpdateOrganization}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
