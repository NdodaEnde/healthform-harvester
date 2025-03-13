
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

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
    
    // Show a toast notification
    if (isDocumentUrlMismatch) {
      toast.error("Document URL format incorrect", {
        description: "Using 'document' instead of 'documents' in the URL. Redirecting to correct URL.",
      });
      
      // Auto-redirect after a short delay if this is a document URL mismatch
      const timer = setTimeout(() => {
        if (correctedPath) navigate(correctedPath);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      toast.error("Page not found", {
        description: `The page "${pathname}" does not exist or is not accessible.`,
      });
    }
  }, [pathname, navigate, isDocumentUrlMismatch, correctedPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-5xl font-bold mb-2 text-gray-900 dark:text-gray-100">404</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">Page Not Found</p>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {isDocumentUrlMismatch 
            ? "You're using 'document' instead of 'documents' in the URL. Redirecting you shortly..." 
            : "The page you're looking for doesn't exist or you don't have permission to access it."}
          <br />
          <span className="text-sm mt-2 block font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {pathname}
          </span>
          {correctedPath && (
            <span className="text-sm mt-2 block font-mono bg-green-50 dark:bg-green-900 p-2 rounded border border-green-200 dark:border-green-800">
              Correct URL: {correctedPath}
            </span>
          )}
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
          {correctedPath && (
            <Button 
              onClick={() => navigate(correctedPath)}
              variant="default"
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Go to Document
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
