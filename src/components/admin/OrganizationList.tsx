
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Edit, Users } from "lucide-react";
import { Organization } from "@/types/organization";

type OrganizationWithStatus = Organization & {
  is_active?: boolean;
};

interface OrganizationListProps {
  organizations: OrganizationWithStatus[];
}

export default function OrganizationList({ organizations }: OrganizationListProps) {
  const [orgs, setOrgs] = useState<OrganizationWithStatus[]>(organizations);
  
  const toggleOrganizationStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: !isActive })
        .eq("id", id);
        
      if (error) throw error;
      
      setOrgs(orgs.map(org => 
        org.id === id ? { ...org, is_active: !isActive } : org
      ));
      
      toast({
        title: `Organization ${isActive ? 'deactivated' : 'activated'}`,
        description: "Status updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating organization status:", error);
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organization</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orgs.length > 0 ? (
          orgs.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>
                {org.organization_type === "service_provider" 
                  ? "Service Provider" 
                  : org.organization_type === "client" 
                    ? "Client" 
                    : org.organization_type}
              </TableCell>
              <TableCell>
                <Badge variant={org.is_active !== false ? "success" : "destructive"}>
                  {org.is_active !== false ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Link to={`/admin/organizations/${org.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/admin/organizations/${org.id}/users`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant={org.is_active !== false ? "destructive" : "outline"} 
                    size="sm"
                    onClick={() => toggleOrganizationStatus(org.id, org.is_active !== false)}
                  >
                    {org.is_active !== false ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No organizations found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
