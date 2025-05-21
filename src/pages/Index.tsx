
import { motion } from "framer-motion";
import { FileText, Upload, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleUploadClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">SurgiScan</span>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} className="shadow-sm">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} className="shadow-sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <section className="py-20 lg:py-32 container flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Digitize Medical Documents with AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload surgical forms and medical records to extract, analyze, and store critical health data using advanced AI processing.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={handleUploadClick} 
                className="shadow-md"
              >
                <Upload className="h-5 w-5 mr-2" />
                Scrub In to SurgiScan
              </Button>
            </div>
          </motion.div>
        </section>
        
        <section className="py-12 bg-secondary/50">
          <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-3 rounded-full bg-secondary">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Effortless Upload</h3>
              <p className="text-sm text-muted-foreground">
                Quickly upload documents in various formats.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-3 rounded-full bg-secondary">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Secure Processing</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI ensures data privacy and compliance.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="p-3 rounded-full bg-secondary">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Instant Insights</h3>
              <p className="text-sm text-muted-foreground">
                Receive immediate analysis and structured data.
              </p>
            </motion.div>
          </div>
        </section>
      </main>
      
      <footer className="py-6 bg-secondary/10">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} SurgiScan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
