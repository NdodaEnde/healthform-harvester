
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import CreateFirstOrganization from "@/components/CreateFirstOrganization";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingFallback from "@/components/LoadingFallback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Mail } from "lucide-react";
import { PendingInvitationsCard } from "@/components/PendingInvitationsCard";

const FirstTimeSetupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .select("organization_id")
          .eq("user_id", session.user.id);
          
        if (error) {
          console.error("Error checking organizations:", error);
          setError(`Failed to check organizations: ${error.message}`);
          return;
        }
        
        console.log("User organizations:", orgUsers);
        
        // If user already has organizations, redirect to dashboard
        if (orgUsers && orgUsers.length > 0) {
          console.log("User already has organizations, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }
        
        console.log("User has no organizations, showing setup page");
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
            
            <Separator className="my-6" />
            
            <h2 className="text-lg font-semibold mb-4">Or create your own organization:</h2>
            
            <CreateFirstOrganization />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default FirstTimeSetupPage;
