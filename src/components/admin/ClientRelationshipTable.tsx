
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Organization } from "@/types/organization";

interface ClientRelationship {
  id: string;
  client_id: string;
  is_active: boolean;
  relationship_start_date?: string;
  client?: Organization;
}

interface ClientRelationshipTableProps {
  clients: ClientRelationship[];
  serviceProviderId: string;
  onClientUpdated: () => void;
}

export default function ClientRelationshipTable({ 
  clients, 
  serviceProviderId, 
  onClientUpdated 
}: ClientRelationshipTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatOrgType = (type?: string) => {
    if (!type) return "";
    
    switch (type) {
      case "client":
        return "Client";
      default:
        return type;
    }
  };
  
  const toggleClientStatus = async (relationshipId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("organization_relationships")
        .update({ is_active: !isActive })
        .eq("id", relationshipId)
        .eq("service_provider_id", serviceProviderId);
        
      if (error) throw error;
      
      toast({
        title: "Status updated",
        description: `Client relationship ${isActive ? "deactivated" : "activated"}`,
      });
      
      if (onClientUpdated) onClientUpdated();
    } catch (error: any) {
      console.error("Error updating client status:", error);
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    }
  };
  
  const removeClient = async (relationshipId: string) => {
    if (!confirm("Are you sure you want to remove this client relationship?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("organization_relationships")
        .delete()
        .eq("id", relationshipId)
        .eq("service_provider_id", serviceProviderId);
        
      if (error) throw error;
      
      toast({
        title: "Client removed",
        description: "Client relationship has been removed",
      });
      
      if (onClientUpdated) onClientUpdated();
    } catch (error: any) {
      console.error("Error removing client:", error);
      toast({
        title: "Error",
        description: "Failed to remove client relationship",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length > 0 ? (
          clients.map((relationship) => (
            <TableRow key={relationship.id}>
              <TableCell className="font-medium">
                {relationship.client?.name || "Unknown Client"}
              </TableCell>
              <TableCell>
                {formatOrgType(relationship.client?.organization_type)}
              </TableCell>
              <TableCell>
                {relationship.client?.contact_email || "-"}
              </TableCell>
              <TableCell>
                {formatDate(relationship.relationship_start_date)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={relationship.is_active ? "default" : "destructive"}
                >
                  {relationship.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant={relationship.is_active ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleClientStatus(relationship.id, relationship.is_active)}
                  >
                    {relationship.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeClient(relationship.id)}
                  >
                    Remove
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10 text-gray-500">
              No client relationships found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
