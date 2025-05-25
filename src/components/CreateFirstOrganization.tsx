
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
          .eq("user_id", user.id as any)
          .limit(1);
          
        if (error) {
          console.error("Error checking existing organizations:", error);
          return;
        }
        
        if (data && data.length > 0) {
          // Check if organizations data exists and is not an error
          const orgUserData = data[0];
          if (orgUserData && 'organizations' in orgUserData && orgUserData.organizations) {
            const orgData = orgUserData.organizations as any;
            if (orgData && orgData.id && orgData.name) {
              setExistingOrg({
                id: orgData.id,
                name: orgData.name
              });
              
              // Pre-fill the form with existing org name
              setName(orgData.name);
            }
          }
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
      
      toast.success("Organization connected", {
        description: `You've been connected to ${existingOrg.name}.`
      });
      
      // Clear any previous organization creation flags
      localStorage.removeItem("organization_created");
      localStorage.removeItem("just_created_account");
      
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error joining organization:", err);
      setError(err.message || "Failed to join organization");
      
      toast.error("Error", {
        description: "Failed to join organization"
      });
    } finally {
      setIsSubmitting(false);
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
      toast.error("Organization name required", {
        description: "Please enter a name for your organization"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log("Creating organization:", name, organizationType);
      
      // Call the database function to create the organization
      const { data: orgId, error } = await supabase.rpc(
        'create_first_organization',
        {
          org_name: name,
          org_type: organizationType,
          org_email: contactEmail || null
        }
      );
      
      if (error) {
        console.error("Error from create_first_organization:", error);
        throw error;
      }
      
      console.log("Organization created with ID:", orgId);
      localStorage.setItem("currentOrganizationId", String(orgId));
      
      toast.success("Organization created", {
        description: `${name} has been created successfully.`
      });
      
      // Set a flag to indicate successful organization creation and clear other flags
      localStorage.setItem("organization_created", "true");
      localStorage.removeItem("just_created_account");
      
      navigate("/dashboard");
      
    } catch (error: any) {
      console.error("Error creating organization:", error);
      setError(error.message || "Failed to create organization. Please try again later.");
      
      toast.error("Error", {
        description: error.message || "Failed to create organization"
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
