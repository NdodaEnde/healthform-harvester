
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, Home, FileText } from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Check if this is a document URL with incorrect format
  const isDocumentUrlMismatch = pathname.startsWith('/document/');
  const documentId = isDocumentUrlMismatch ? pathname.split('/').pop() : null;
  const correctedPath = documentId ? `/documents/${documentId}` : null;
  
  // Handle preview routes
  const isPreview = pathname.includes('index.html') || pathname === '/';

  useEffect(() => {
    console.log("NotFound component mounted for path:", pathname);
    
    if (isPreview) {
      // In preview mode, navigate to dashboard
      navigate("/dashboard");
      return;
    }
    
    // Immediately redirect if this is a document URL mismatch
    if (isDocumentUrlMismatch && correctedPath) {
      toast.info("Redirecting to correct document URL", {
        description: "Using '/documents/' format instead of '/document/'",
      });
      navigate(correctedPath);
    } else {
      toast.error("Page not found", {
        description: `The page "${pathname}" does not exist or is not accessible.`,
      });
    }
  }, [pathname, navigate, isDocumentUrlMismatch, correctedPath, isPreview]);

  // If we're about to redirect, we can show a simpler loading state
  if (isDocumentUrlMismatch && correctedPath || isPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-5xl font-bold mb-2 text-gray-900 dark:text-gray-100">404</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Page Not Found</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or you don't have permission to access it.
          <br />
          <span className="text-sm mt-2 block font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {pathname}
          </span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate("/dashboard")}
            className="flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
