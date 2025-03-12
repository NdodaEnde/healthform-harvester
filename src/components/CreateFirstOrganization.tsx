
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Building, Briefcase } from "lucide-react";

const CreateFirstOrganization = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] = useState("direct_client");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<any>(null);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a name for your organization",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setDetailedError(null);
      
      // Get current user to verify they're authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw new Error("Failed to get current user. Please try again or sign in again.");
      }
      
      if (!user) {
        throw new Error("User not authenticated. Please sign in again.");
      }
      
      console.log("Authenticated user:", user.id);
      
      // First, check if user already has an organization
      const { data: existingOrgs, error: existingError } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id);
        
      if (existingError) {
        console.error("Error checking existing organizations:", existingError);
        throw new Error(`Failed to check existing organizations: ${existingError.message}`);
      }
      
      // If user already has an organization, use that
      if (existingOrgs && existingOrgs.length > 0) {
        console.log("User already has an organization:", existingOrgs[0].organization_id);
        
        // Set the organization as current in localStorage
        localStorage.setItem("currentOrganizationId", existingOrgs[0].organization_id);
        
        toast({
          title: "Existing organization found",
          description: "You've been connected to your existing organization.",
        });
        
        // Redirect to dashboard
        navigate("/dashboard");
        return;
      }
      
      // Only create a new organization if the user doesn't have one
      console.log("Creating new organization with type:", organizationType);
      
      // Call the security definer function to create the organization
      const { data: organizationId, error: orgError } = await supabase.rpc(
        'create_first_organization',
        {
          org_name: name,
          org_type: organizationType,
          org_email: contactEmail || null
        }
      );
      
      if (orgError) {
        console.error("Organization creation error:", orgError);
        console.error("Organization creation error details:", {
          code: orgError.code,
          message: orgError.message,
          details: orgError.details,
          hint: orgError.hint
        });
        
        // Handle duplicate key violation specifically
        if (orgError.code === '23505' && orgError.message.includes('organization_users_organization_id_user_id_key')) {
          // This means the user already belongs to this organization
          // We can fetch the existing organization ID and proceed
          const { data: existingOrgUsers } = await supabase
            .from("organization_users")
            .select("organization_id")
            .eq("user_id", user.id)
            .single();
            
          if (existingOrgUsers) {
            // Set the organization as current in localStorage
            localStorage.setItem("currentOrganizationId", existingOrgUsers.organization_id);
            
            toast({
              title: "Organization access granted",
              description: "You already have access to an organization.",
            });
            
            // Redirect to dashboard
            navigate("/dashboard");
            return;
          }
        }
        
        setDetailedError(orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }
      
      console.log("Organization created successfully with ID:", organizationId);
      
      toast({
        title: "Organization created",
        description: `${name} has been created successfully.`,
      });
      
      // Set the organization as current in localStorage
      localStorage.setItem("currentOrganizationId", organizationId);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      setError(error.message || "Failed to create organization. Please try again later.");
      
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Your Organization</CardTitle>
        <CardDescription>
          You need to create or join an organization to use this application.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleCreateOrganization}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {detailedError && (
            <div className="text-xs text-red-500 p-2 bg-red-50 rounded border border-red-100 mb-4">
              <p className="font-medium">Detailed error information:</p>
              <pre className="mt-1 overflow-x-auto">
                {JSON.stringify(detailedError, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Organization Name
            </label>
            <Input
              id="name"
              placeholder="Enter organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Organization Type
            </label>
            <Select
              value={organizationType}
              onValueChange={setOrganizationType}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct_client">
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4" />
                    <span>Client Organization</span>
                  </div>
                </SelectItem>
                <SelectItem value="service_provider">
                  <div className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Service Provider</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Contact Email (Optional)
            </label>
            <Input
              id="email"
              type="email"
              placeholder="contact@organization.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating</span>
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              "Create Organization"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreateFirstOrganization;
