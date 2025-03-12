
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import CreateFirstOrganization from "@/components/CreateFirstOrganization";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingFallback from "@/components/LoadingFallback";

const FirstTimeSetupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to auth if not logged in
          navigate("/auth");
          return;
        }
        
        // Check if user already has organizations
        const { data: orgUsers, error } = await supabase
          .from("organization_users")
          .select("organization_id")
          .eq("user_id", session.user.id);
          
        if (error) {
          console.error("Error checking organizations:", error);
        }
        
        // If user already has organizations, redirect to dashboard
        if (orgUsers && orgUsers.length > 0) {
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Setup page error:", error);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <CreateFirstOrganization />
        </motion.div>
      </main>
    </div>
  );
};

export default FirstTimeSetupPage;
