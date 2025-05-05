
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

const FirstTimeSetupPage = () => {
  const navigate = useNavigate();
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
        
        // Check if user already has organizations
        const { data: orgUsers, error } = await supabase
          .from("organization_users")
          .select("organization_id, organizations:organization_id(id, name)")
          .eq("user_id", session.user.id);
          
        if (error) {
          console.error("Error checking organizations:", error);
          setError(`Failed to check organizations: ${error.message}`);
          return;
        }
        
        console.log("User organizations:", orgUsers);
        
        // If user already has organizations, provide option to join existing one
        if (orgUsers && orgUsers.length > 0 && orgUsers[0].organizations) {
          console.log("User already has organizations");
          setHasOrganizations(true);
          
          const orgData = orgUsers[0].organizations as {id: string, name: string};
          setOrgDetails({
            id: orgData.id,
            name: orgData.name
          });
          
          // Only redirect to dashboard automatically if we're not in the middle of account setup
          const justCreatedAccount = localStorage.getItem("just_created_account");
          if (!justCreatedAccount) {
            // Instead of redirecting, we'll provide a button to join the existing org
            // This way the user can choose what to do and avoid redirect loops
            console.log("Not redirecting automatically, showing join option");
          } else {
            console.log("Just created account, not redirecting automatically");
            // Clear the flag after use
            localStorage.removeItem("just_created_account");
          }
        } else {
          console.log("User has no organizations, showing setup page");
        }
      } catch (error: any) {
        console.error("Setup page error:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (isLoading) {
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Organization Already Created</AlertTitle>
                <AlertDescription>
                  You already have access to an organization. You can access it from the dashboard.
                </AlertDescription>
              </Alert>
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
