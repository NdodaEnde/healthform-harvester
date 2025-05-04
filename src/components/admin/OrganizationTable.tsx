
import { useNavigate } from "react-router-dom";
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
import { Edit, Users, Link as LinkIcon } from "lucide-react";
import { Organization } from "@/types/organization";

interface OrganizationTableProps {
  organizations: Organization[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onRefresh: () => void;
}

export default function OrganizationTable({ 
  organizations, 
  onToggleStatus, 
  onRefresh 
}: OrganizationTableProps) {
  const navigate = useNavigate();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatOrgType = (type: string) => {
    switch (type) {
      case "service_provider":
        return "Service Provider";
      case "client":
        return "Client";
      default:
        return type;
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{formatOrgType(org.organization_type)}</TableCell>
                <TableCell>{org.contact_email || "-"}</TableCell>
                <TableCell>{formatDate(org.created_at)}</TableCell>
                <TableCell>
                  <Badge 
                    variant={org.is_active !== false ? "default" : "destructive"}
                  >
                    {org.is_active !== false ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/admin/organizations/${org.id}/edit`)}
                    >
                      <Edit size={16} />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/admin/organizations/${org.id}/users`)}
                    >
                      <Users size={16} />
                    </Button>
                    
                    {org.organization_type === "service_provider" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/admin/organizations/${org.id}/clients`)}
                      >
                        <LinkIcon size={16} />
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant={org.is_active !== false ? "destructive" : "outline"}
                      onClick={() => onToggleStatus(org.id, org.is_active !== false)}
                    >
                      {org.is_active !== false ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                No organizations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
