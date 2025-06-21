import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import ClientRelationshipTable from "@/components/admin/ClientRelationshipTable";
import AddClientForm from "@/components/admin/AddClientForm";
import { Organization } from "@/types/organization";

export default function OrganizationClientsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationLoading, setOrganizationLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchOrganization();
    }
  }, [id]);
  
  const fetchOrganization = async () => {
    try {
      setOrganizationLoading(true);
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id as any)
        .single();
        
      if (error) throw error;
      
      if (data.organization_type !== "service_provider") {
        toast({
          title: "Invalid operation",
          description: "Only service providers can manage client relationships",
          variant: "destructive",
        });
        navigate("/admin/organizations");
        return;
      }
      
      setOrganization(data);
    } catch (error: any) {
      console.error("Error fetching organization:", error);
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive",
      });
    } finally {
      setOrganizationLoading(false);
    }
  };
  
  const handleClientAdded = () => {
    // This will trigger the ClientRelationshipTable to refresh via its useEffect
    // No need to manage client state here
  };
  
  if (organizationLoading) {
    return (
      <div className="container py-10">
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/admin/organizations")}
      >
        <ArrowLeft size={16} /> Back to Organizations
      </Button>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {organization ? organization.name : "Organization"} - Clients
        </h1>
        {organization && (
          <p className="text-gray-500 mt-1">
            Manage client relationships for this service provider
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Client Relationships</CardTitle>
              <CardDescription>
                Organizations this service provider manages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientRelationshipTable 
                serviceProviderId={id || ""}
                key={id} // Force re-render when ID changes
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <AddClientForm 
            serviceProviderId={id || ""}
            onSuccess={handleClientAdded}
          />
        </div>
      </div>
    </div>
  );
}