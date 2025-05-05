
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import LoadingFallback from "./LoadingFallback";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status first
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("Checking authentication status");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("User is authenticated");
          setIsAuthenticated(true);
        } else {
          console.log("No active session found");
          setIsAuthenticated(false);
          
          // If not on a public route, show notification
          if (!isPublicRoute(location.pathname)) {
            toast.error("Authentication required", {
              description: "Please sign in to access this page"
            });
          }
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        setIsAuthenticated(false);
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    checkAuthStatus();
  }, [location.pathname]);
  
  // Check for special URL paths that need handling
  useEffect(() => {
    // Check for auth tokens in URL hash (OAuth flows)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    
    // Check for invitation token in query params
    const queryParams = new URLSearchParams(window.location.search);
    const inviteToken = queryParams.get("token");
    
    // Keep loading state if processing authentication or invitation
    if (accessToken || 
        location.pathname.includes('/auth/callback') || 
        location.pathname.includes('/callback') ||
        (inviteToken && location.pathname.includes('/accept-invite'))) {
      setIsAuthenticating(true);
    }
  }, [location]);
  
  // If still checking authentication or loading organization data, show loading indicator
  if (isAuthenticating || (loading && !isPublicRoute(location.pathname))) {
    console.log("Loading state: authenticating or loading org data");
    return <LoadingFallback />;
  }
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    console.log("On public route:", location.pathname);
    return <>{children}</>;
  }
  
  // If not authenticated and not on a public route, redirect to auth
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Special handling for setup page - always allow access when authenticated
  if (location.pathname === "/setup") {
    console.log("On setup page, allowing access");
    return <>{children}</>;
  }
  
  // For all protected routes except setup, enforce organization context
  if (!currentOrganization && !isPublicRoute(location.pathname)) {
    console.log("No organization context, redirecting to setup");
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }
  
  // User is authenticated and has organization context (or is on a public route)
  console.log("Rendering protected content");
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
