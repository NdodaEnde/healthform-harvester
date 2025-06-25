
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import CreateFirstOrganization from "@/components/CreateFirstOrganization";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingFallback from "@/components/LoadingFallback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PendingInvitationsCard } from "@/components/PendingInvitationsCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

const FirstTimeSetupPage = () => {
  const navigate = useNavigate();
  const { userOrganizations, initialLoadComplete, loading } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOrganizations, setHasOrganizations] = useState(false);
  const [orgDetails, setOrgDetails] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Failed to verify authentication status. Please try signing in again.");
          return;
        }
        
        if (!session) {
          // Redirect to auth if not logged in
          console.log("No session found, redirecting to auth page");
          navigate("/auth");
          return;
        }
        
        console.log("User authenticated:", session.user.id);
        
        // Wait for organization data to load completely
        if (!initialLoadComplete || loading) {
          console.log("Waiting for organization data to load...", { initialLoadComplete, loading });
          return;
        }
        
        console.log("Organization data loaded, checking organizations:", userOrganizations.length);
        
        // If this component is mounted but user already has organizations, 
        // they should be redirected to dashboard
        if (userOrganizations.length > 0) {
          console.log("User already has organizations, redirecting to dashboard");
          setHasOrganizations(true);
          const firstOrg = userOrganizations[0];
          setOrgDetails({
            id: firstOrg.id,
            name: firstOrg.name
          });
          
          // Set a small delay before redirecting to ensure component is mounted
          setTimeout(() => {
            navigate("/dashboard");
          }, 100);
        }
      } catch (error: any) {
        console.error("Setup page error:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, userOrganizations, initialLoadComplete, loading]);

  // Function to handle joining an existing organization
  const handleJoinExistingOrg = () => {
    if (!orgDetails) return;
    
    // Set organization ID in localStorage
    localStorage.setItem("currentOrganizationId", orgDetails.id);
    
    // Clear any previous flags
    localStorage.removeItem("organization_created");
    localStorage.removeItem("just_created_account");
    
    toast.success("Organization connected", {
      description: `You've been connected to ${orgDetails.name}.`
    });
    
    navigate("/dashboard");
  };

  // Show loading while waiting for organization data
  if (isLoading || loading || !initialLoadComplete) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">HealthForm Harvester</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md space-y-6"
          >
            {/* Display pending invitations at the top if there are any */}
            <PendingInvitationsCard />
            
            {hasOrganizations ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Organization Already Created</AlertTitle>
                  <AlertDescription>
                    You already have access to an organization: <strong>{orgDetails?.name}</strong>
                  </AlertDescription>
                </Alert>
                <Button 
                  className="w-full" 
                  onClick={handleJoinExistingOrg}
                >
                  Access Dashboard
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Create your organization:</h2>
                <CreateFirstOrganization />
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FirstTimeSetupPage;
