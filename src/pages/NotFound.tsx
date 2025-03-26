
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, Home } from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
    
    toast.error("Page not found", {
      description: `The page "${pathname}" does not exist or is not accessible.`,
    });
  }, [pathname]);

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
