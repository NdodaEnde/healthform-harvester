
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

interface ClientRelationship {
  id: string;
  client_id: string;
  is_active: boolean;
  relationship_start_date?: string;
  client?: Organization;
}

export default function OrganizationClientsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clients, setClients] = useState<ClientRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchOrganization();
      fetchClients();
    }
  }, [id]);
  
  const fetchOrganization = async () => {
    try {
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
    }
  };
  
  const fetchClients = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // First get the relationship records
      const { data: relationships, error: relationshipsError } = await supabase
        .from("organization_relationships")
        .select(`
          id,
          client_id,
          is_active,
          relationship_start_date
        `)
        .eq("service_provider_id", id as any);
        
      if (relationshipsError) throw relationshipsError;
      
      // Now fetch the client details for each relationship
      if (relationships && relationships.length > 0) {
        const clientIds = relationships.map(rel => rel.client_id);
        
        const { data: clientsData, error: clientsError } = await supabase
          .from("organizations")
          .select("id, name, organization_type, contact_email")
          .in("id", clientIds);
          
        if (clientsError) throw clientsError;
        
        // Combine the data
        const clientsWithDetails: ClientRelationship[] = relationships.map(rel => {
          const clientDetails = clientsData?.find(c => c.id === rel.client_id);
          return {
            ...rel,
            client: clientDetails
          };
        });
        
        setClients(clientsWithDetails);
      } else {
        setClients([]);
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to load client relationships",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleClientAdded = () => {
    // Refresh both lists after adding a client
    fetchClients();
  };
  
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
              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <ClientRelationshipTable 
                  serviceProviderId={id || ""}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <AddClientForm 
            onSuccess={handleClientAdded}
          />
        </div>
      </div>
    </div>
  );
}
