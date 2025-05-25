import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Building2, Users, Settings } from "lucide-react";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: any;
  settings: any;
  created_at: string;
  updated_at: string;
}

const OrganizationsList = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching organizations:", error);
        return;
      }

      if (!data || !Array.isArray(data)) {
        setOrganizations([]);
        return;
      }

      // Safe type conversion with proper validation
      const typedOrganizations: Organization[] = data
        .filter((item: any): item is Record<string, any> => {
          return item !== null && 
                 typeof item === 'object' &&
                 'id' in item && item.id &&
                 'name' in item && item.name &&
                 'organization_type' in item && item.organization_type &&
                 'created_at' in item && item.created_at;
        })
        .map((item: Record<string, any>) => ({
          id: String(item.id),
          name: String(item.name),
          organization_type: String(item.organization_type),
          contact_email: item.contact_email ? String(item.contact_email) : null,
          contact_phone: item.contact_phone ? String(item.contact_phone) : null,
          address: item.address,
          settings: item.settings,
          created_at: String(item.created_at),
          updated_at: item.updated_at ? String(item.updated_at) : String(item.created_at)
        }));

      setOrganizations(typedOrganizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationTypeVariant = (type: string) => {
    switch (type) {
      case "service_provider":
        return "default";
      case "client":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getOrganizationTypeLabel = (type: string) => {
    switch (type) {
      case "service_provider":
        return "Service Provider";
      case "client":
        return "Client";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <div className="text-center py-8">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Button onClick={() => navigate("/admin/organizations/create")}>
          <Building2 className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first organization.
            </p>
            <Button onClick={() => navigate("/admin/organizations/create")}>
              Create Organization
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader onClick={() => navigate(`/admin/organizations/${org.id}`)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                  <Badge variant={getOrganizationTypeVariant(org.organization_type)}>
                    {getOrganizationTypeLabel(org.organization_type)}
                  </Badge>
                </div>
                <CardDescription>
                  {org.contact_email && (
                    <div className="text-sm">{org.contact_email}</div>
                  )}
                  {org.contact_phone && (
                    <div className="text-sm">{org.contact_phone}</div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(org.created_at), "MMM d, yyyy")}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/organizations/${org.id}/users`)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Users
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/organizations/${org.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;
