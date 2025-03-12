
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import OrganizationList from "@/components/admin/OrganizationList";
import { toast } from "@/components/ui/use-toast";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .order("name");
          
        if (error) throw error;
        setOrganizations(data || []);
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
    }
    
    fetchOrganizations();
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Link to="/admin/organizations/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-r-transparent rounded-full"></div>
            </div>
          ) : (
            <OrganizationList organizations={organizations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
