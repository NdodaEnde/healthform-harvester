
import { useState, useEffect } from "react";
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
  const [checkingExistingOrg, setCheckingExistingOrg] = useState(true);
  const [existingOrg, setExistingOrg] = useState<{id: string, name: string} | null>(null);

  // Check if user already has an organization on component mount
  useEffect(() => {
    const checkExistingOrganization = async () => {
      try {
        setCheckingExistingOrg(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("User not authenticated:", userError);
          return;
        }
        
        // Check for existing organization membership
        const { data, error } = await supabase
          .from("organization_users")
          .select(`
            organization_id,
            organizations:organization_id (
              id,
              name
            )
          `)
          .eq("user_id", user.id)
          .limit(1);
          
        if (error) {
          console.error("Error checking existing organizations:", error);
          return;
        }
        
        if (data && data.length > 0 && data[0].organizations) {
          // User already has an organization
          const orgData = data[0].organizations;
          setExistingOrg({
            id: orgData.id,
            name: orgData.name
          });
          
          // Pre-fill the form with existing org name
          setName(orgData.name);
        }
      } catch (err) {
        console.error("Error checking organization:", err);
      } finally {
        setCheckingExistingOrg(false);
      }
    };
    
    checkExistingOrganization();
  }, []);

  // Function to handle joining an existing organization
  const handleJoinExistingOrganization = async () => {
    if (!existingOrg) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      localStorage.setItem("currentOrganizationId", existingOrg.id);
      
      toast({
        title: "Organization connected",
        description: `You've been connected to ${existingOrg.name}.`,
      });
      
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error joining organization:", err);
      setError(err.message || "Failed to join organization");
      
      toast({
        title: "Error",
        description: "Failed to join organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to directly query the user's organizations
  const getUserOrganizations = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1);
        
      if (error) throw error;
      
      return data && data.length > 0 ? data[0].organization_id : null;
    } catch (e) {
      console.error("Error getting user organizations:", e);
      return null;
    }
  };

  // Function to extract org ID from error message
  const extractOrgIdFromError = (errorDetails: string): string | null => {
    try {
      const match = errorDetails.match(/\(organization_id, user_id\)=\(([^,]+),/);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Failed to extract organization ID from error:", e);
      return null;
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user already has an organization, just connect to it
    if (existingOrg) {
      await handleJoinExistingOrganization();
      return;
    }
    
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
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(userError?.message || "User not authenticated. Please sign in again.");
      }
      
      console.log("Creating organization for user:", user.id);
      
      // Check if user already has an organization
      const existingOrgId = await getUserOrganizations(user.id);
      
      if (existingOrgId) {
        console.log("User already has organization:", existingOrgId);
        localStorage.setItem("currentOrganizationId", existingOrgId);
        
        // Get organization name for better UX
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", existingOrgId)
          .single();
          
        const orgName = orgData?.name || "your organization";
        
        toast({
          title: "Organization connected",
          description: `You've been connected to ${orgName}.`,
        });
        
        navigate("/dashboard");
        return;
      }
      
      // Try to create a new organization
      try {
        const { data: orgId, error: createError } = await supabase.rpc(
          'create_first_organization',
          {
            org_name: name,
            org_type: organizationType,
            org_email: contactEmail || null
          }
        );
        
        if (createError) {
          // Special handling for duplicate key error
          if (createError.code === '23505' && createError.details?.includes('organization_users_organization_id_user_id_key')) {
            // Try to extract the existing organization ID from the error message
            const extractedOrgId = extractOrgIdFromError(createError.details);
            
            if (extractedOrgId) {
              localStorage.setItem("currentOrganizationId", extractedOrgId);
              
              // Get organization name for better UX
              const { data: orgData } = await supabase
                .from("organizations")
                .select("name")
                .eq("id", extractedOrgId)
                .single();
                
              const orgName = orgData?.name || "your organization";
              
              toast({
                title: "Organization connected",
                description: `You've been connected to ${orgName}.`,
              });
              
              navigate("/dashboard");
              return;
            }
            
            // If we couldn't extract the ID from the error, try another direct check
            const fallbackOrgId = await getUserOrganizations(user.id);
            
            if (fallbackOrgId) {
              localStorage.setItem("currentOrganizationId", fallbackOrgId);
              
              // Get organization name for better UX
              const { data: orgData } = await supabase
                .from("organizations")
                .select("name")
                .eq("id", fallbackOrgId)
                .single();
                
              const orgName = orgData?.name || "your organization";
              
              toast({
                title: "Organization connected",
                description: `You've been connected to ${orgName}.`,
              });
              
              navigate("/dashboard");
              return;
            }
            
            // If we still can't get the organization ID, inform the user
            throw new Error("You already have an organization but we couldn't determine which one. Please contact support.");
          }
          
          throw createError;
        }
        
        console.log("Organization created with ID:", orgId);
        localStorage.setItem("currentOrganizationId", orgId);
        
        toast({
          title: "Organization created",
          description: `${name} has been created successfully.`,
        });
        
        navigate("/dashboard");
      } catch (err: any) {
        throw err;
      }
      
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
        <CardTitle>{existingOrg ? "Join Your Organization" : "Create Your Organization"}</CardTitle>
        <CardDescription>
          {existingOrg 
            ? "You already have access to an organization." 
            : "You need to create or join an organization to use this application."}
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
          
          {existingOrg ? (
            <Alert>
              <AlertTitle>Organization Found</AlertTitle>
              <AlertDescription>
                You already have access to {existingOrg.name}. Click below to continue.
              </AlertDescription>
            </Alert>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || checkingExistingOrg}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">{existingOrg ? "Joining" : "Creating"}</span>
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
              </>
            ) : existingOrg ? (
              "Join Organization"
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
