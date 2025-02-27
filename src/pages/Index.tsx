
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, FileText, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mr-4 flex items-center space-x-2"
          >
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">HealthForm Harvester</span>
          </motion.div>
          <div className="flex-1" />
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            <Button variant="ghost" className="text-sm font-medium">
              About
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Features
            </Button>
            <Button variant="ghost" className="text-sm font-medium">
              Contact
            </Button>
            <Button onClick={handleGetStarted}>Get Started</Button>
          </motion.div>
        </div>
      </nav>

      <main className="flex-1 container max-w-screen-xl mx-auto py-12 px-4 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-6"
          >
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="inline-block"
              >
                <span className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                  Streamlined Document Processing
                </span>
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance"
            >
              Digital Health Forms <br />
              <span className="text-primary">Simplified</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-muted-foreground text-lg md:text-xl max-w-md text-balance"
            >
              Transform paper forms into digital data instantly. Streamline your occupational health workflow with our intelligent document processing system.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group relative overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <motion.span 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ 
                    x: isHovered ? 5 : -10,
                    opacity: isHovered ? 1 : 0
                  }}
                  className="relative z-10 inline-block ml-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.span>
                <motion.div
                  initial={{ scale: 0, x: "-50%", y: "-50%" }}
                  animate={{ 
                    scale: isHovered ? 1.5 : 0
                  }}
                  transition={{ duration: 0.4 }}
                  className="absolute left-1/2 top-1/2 h-32 w-32 bg-primary/10 rounded-full"
                />
              </Button>
              <Button size="lg" variant="outline">Learn More</Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              className="flex items-center pt-6 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
              Secure Document Processing
              <CheckCircle2 className="mr-2 h-4 w-4 text-primary ml-6" />
              AI-Powered Extraction
              <CheckCircle2 className="mr-2 h-4 w-4 text-primary ml-6" />
              Simple Workflow
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="glass-card rounded-xl p-8 aspect-square max-w-md mx-auto w-full flex items-center justify-center"
          >
            <div className="text-center space-y-6">
              <Upload className="h-16 w-16 mx-auto text-primary/80" strokeWidth={1.25} />
              <h3 className="text-xl font-medium">Upload & Process Health Documents</h3>
              <p className="text-muted-foreground text-balance">
                Drag and drop your medical examination questionnaires or certificates of fitness to begin.
              </p>
              <Button 
                onClick={handleGetStarted} 
                className="mt-4"
              >
                Upload Document
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2023 HealthForm Harvester. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-xs">
              Privacy Policy
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              Terms of Service
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              Support
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
