
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OrganizationForm from "@/components/admin/OrganizationForm";
import { toast } from "@/components/ui/use-toast";

export default function EditOrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchOrganization() {
      if (!id) {
        navigate("/admin/organizations");
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) throw error;
        setOrganization(data);
      } catch (error: any) {
        console.error("Error fetching organization:", error);
        toast({
          title: "Error",
          description: "Failed to load organization data",
          variant: "destructive",
        });
        navigate("/admin/organizations");
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganization();
  }, [id, navigate]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-r-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Organization</h1>
      {organization && (
        <OrganizationForm organization={organization} isEdit={true} />
      )}
    </div>
  );
}
