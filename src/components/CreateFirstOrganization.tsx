
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
  const [organizationType, setOrganizationType] = useState("client");
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
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        throw new Error("Failed to get current user. Please try again or sign in again.");
      }
      
      if (!user) {
        throw new Error("User not authenticated. Please sign in again.");
      }
      
      console.log("Authenticated user:", user.id);
      console.log("Attempting to create organization:", { name, organizationType, contactEmail });
      
      // First, check if the user already has any organizations
      const { data: existingOrgs, error: existingOrgsError } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id);
        
      if (existingOrgsError) {
        console.error("Error checking existing organizations:", existingOrgsError);
        setDetailedError(existingOrgsError);
        throw new Error(`Failed to check existing organizations: ${existingOrgsError.message}`);
      }
      
      if (existingOrgs && existingOrgs.length > 0) {
        toast({
          title: "Organization already exists",
          description: "You already have an organization. Redirecting to dashboard.",
          variant: "default",
        });
        
        // Set the organization as current in localStorage
        localStorage.setItem("currentOrganizationId", existingOrgs[0].organization_id);
        
        // Redirect to dashboard
        navigate("/dashboard");
        return;
      }
      
      // Insert organization - the trigger will automatically associate the user
      // We'll add more detailed error handling to troubleshoot any issues
      console.log("Creating organization with payload:", {
        name,
        organization_type: organizationType,
        contact_email: contactEmail || null,
      });
      
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          organization_type: organizationType,
          contact_email: contactEmail || null,
        })
        .select()
        .single();
        
      if (orgError) {
        console.error("Organization creation error:", orgError);
        console.error("Organization creation error details:", {
          code: orgError.code,
          message: orgError.message,
          details: orgError.details,
          hint: orgError.hint
        });
        setDetailedError(orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }
      
      console.log("Organization created successfully:", organization);
      
      // Verify the organization_users entry was created by the trigger
      const { data: orgUser, error: verifyError } = await supabase
        .from("organization_users")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("user_id", user.id)
        .single();
        
      if (verifyError) {
        console.warn("Warning: Could not verify organization user association:", verifyError);
        console.warn("This may indicate the trigger didn't work, but organization was created");
        // We'll continue anyway, the organization was created
      } else {
        console.log("Organization user association verified:", orgUser);
      }
      
      toast({
        title: "Organization created",
        description: `${name} has been created successfully.`,
      });
      
      // Set the organization as current in localStorage
      localStorage.setItem("currentOrganizationId", organization.id);
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      
      // Enhanced error handling for RLS issues
      if (error.message?.includes("new row violates row-level security policy")) {
        setError("Permission denied: Unable to create organization due to security policy restrictions. This might indicate an issue with the database trigger not firing properly.");
        console.error("RLS policy violation. This might indicate the trigger is not working or user authentication is not being properly passed.");
      } else {
        setError(error.message || "Failed to create organization. Please try again later.");
      }
      
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
                <SelectItem value="client">
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
