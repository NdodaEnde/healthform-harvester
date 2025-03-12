
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

  const extractOrgIdFromError = (errorDetails: string): string | null => {
    try {
      const match = errorDetails.match(/\(organization_id, user_id\)=\(([^,]+),/);
      return match ? match[1] : null;
    } catch (e) {
      console.error("Failed to extract organization ID from error:", e);
      return null;
    }
  };

  const getUserOrganization = async (userId: string): Promise<string | null> => {
    try {
      const { data: orgUsers, error } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1);
        
      if (error) throw error;
      
      return orgUsers && orgUsers.length > 0 ? orgUsers[0].organization_id : null;
    } catch (e) {
      console.error("Error getting user organization:", e);
      return null;
    }
  };

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
      
      if (userError || !user) {
        throw new Error(userError?.message || "User not authenticated. Please sign in again.");
      }
      
      console.log("Authenticated user ID:", user.id);
      
      // Double-check if user already has an organization (direct DB check)
      const existingOrgId = await getUserOrganization(user.id);
      
      // If user already has an organization, use it
      if (existingOrgId) {
        console.log("Found existing organization:", existingOrgId);
        localStorage.setItem("currentOrganizationId", existingOrgId);
        
        toast({
          title: "Organization connected",
          description: "You've been connected to your existing organization.",
        });
        
        navigate("/dashboard");
        return;
      }
      
      // Try to create a new organization
      try {
        console.log("Creating new organization:", name, organizationType);
        
        const { data: orgId, error: createError } = await supabase.rpc(
          'create_first_organization',
          {
            org_name: name,
            org_type: organizationType,
            org_email: contactEmail || null
          }
        );
        
        if (createError) {
          console.error("Organization creation error:", createError);
          setDetailedError(createError);
          
          // Handle duplicate key error
          if (createError.code === '23505' && createError.details?.includes('organization_users_organization_id_user_id_key')) {
            const extractedOrgId = extractOrgIdFromError(createError.details);
            
            if (extractedOrgId) {
              console.log("Extracted existing organization ID from error:", extractedOrgId);
              localStorage.setItem("currentOrganizationId", extractedOrgId);
              
              toast({
                title: "Organization connected",
                description: "You've been connected to your existing organization.",
              });
              
              navigate("/dashboard");
              return;
            }
            
            // If we couldn't extract the ID, try one more direct check
            const fallbackOrgId = await getUserOrganization(user.id);
            
            if (fallbackOrgId) {
              console.log("Fallback: found existing organization:", fallbackOrgId);
              localStorage.setItem("currentOrganizationId", fallbackOrgId);
              
              toast({
                title: "Organization connected",
                description: "You've been connected to your existing organization.",
              });
              
              navigate("/dashboard");
              return;
            }
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
        return;
      } catch (createErr: any) {
        // Final fallback - check one more time for an organization
        if (createErr.code === '23505') {
          console.log("Handling duplicate key error, final attempt");
          
          const finalOrgId = await getUserOrganization(user.id);
          
          if (finalOrgId) {
            console.log("Final attempt: found existing organization:", finalOrgId);
            localStorage.setItem("currentOrganizationId", finalOrgId);
            
            toast({
              title: "Organization connected",
              description: "You've been connected to your existing organization.",
            });
            
            navigate("/dashboard");
            return;
          }
        }
        
        throw createErr;
      }
      
    } catch (error: any) {
      console.error("Error creating/finding organization:", error);
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
