
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Organization } from "@/types/organization";
import { toast } from "@/components/ui/use-toast";

export default function OrganizationsList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
    <div className="w-full max-w-md mx-auto">
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
            <div className="space-y-2">
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <div key={org.id} className="p-3 border rounded-md">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      Type: {org.organization_type}
                    </div>
                    {org.contact_email && (
                      <div className="text-sm">Email: {org.contact_email}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No organizations found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
