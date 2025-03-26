
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, Home } from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a document URL with incorrect format
  const isDocumentUrlMismatch = pathname.startsWith('/document/');
  const documentId = isDocumentUrlMismatch ? pathname.split('/').pop() : null;
  const correctedPath = documentId ? `/documents/${documentId}` : null;

  useEffect(() => {
    // Simple initialization delay to prevent flash of UI
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    // Check if we're in preview mode
    const url = window.location.href;
    const inPreviewMode = url.includes('/preview') || url.includes('preview=true');
    setIsPreviewMode(inPreviewMode);

    // Log diagnostic information
    console.log("NotFound component mounted");
    console.log("Current pathname:", pathname);
    console.log("Preview mode:", inPreviewMode ? "Yes" : "No");
    
    // Only log and toast if not in preview mode
    if (!inPreviewMode) {
      console.error(
        "404 Error: User attempted to access non-existent route:",
        pathname
      );
      
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
    }
    
    return () => clearTimeout(timer);
  }, [pathname, navigate, isDocumentUrlMismatch, correctedPath]);

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If in preview mode, show a more helpful message
  if (isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center max-w-md w-full">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Preview Mode Active</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You're viewing this app in preview mode. Some features like authentication 
            are simulated, and this may cause some routes to show as not found.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current URL: {pathname}
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Home Page
          </Button>
        </div>
      </div>
    );
  }

  // If we're about to redirect, we can show a simpler loading state
  if (isDocumentUrlMismatch && correctedPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">Redirecting to document...</p>
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
            onClick={() => navigate("/")}
            className="flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
