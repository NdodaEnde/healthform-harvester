
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import OrganizationTable from "@/components/admin/OrganizationTable";
import { Organization } from "@/types/organization";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  
  useEffect(() => {
    fetchOrganizations();
  }, []);
  
  useEffect(() => {
    if (organizations.length > 0) {
      const filtered = organizations.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.contact_email && org.contact_email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredOrgs(filtered);
    }
  }, [searchQuery, organizations]);
  
  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          organization_type,
          contact_email,
          logo_url,
          is_active,
          created_at,
          updated_at
        `)
        .order("name");
        
      if (error) throw error;
      
      setOrganizations(data || []);
      setFilteredOrgs(data || []);
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: !currentStatus })
        .eq("id", id);
        
      if (error) throw error;
      
      // Update local state
      setOrganizations(orgs => 
        orgs.map(org => org.id === id ? { ...org, is_active: !currentStatus } : org)
      );
      
      toast({
        title: "Status updated",
        description: `Organization ${currentStatus ? "deactivated" : "activated"}`,
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
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Button 
          onClick={() => navigate("/admin/organizations/new")}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Organization
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <OrganizationTable 
              organizations={filteredOrgs} 
              onToggleStatus={handleToggleStatus}
              onRefresh={fetchOrganizations}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
