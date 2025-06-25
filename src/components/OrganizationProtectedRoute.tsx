
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import LoadingFallback from "./LoadingFallback";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  const { userOrganizations, initialLoadComplete } = useOrganization();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status first
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("OrganizationProtectedRoute: Checking authentication status");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("OrganizationProtectedRoute: User is authenticated");
          setIsAuthenticated(true);
        } else {
          console.log("OrganizationProtectedRoute: No active session found");
          setIsAuthenticated(false);
          
          // If not on a public route, show notification
          if (!isPublicRoute(location.pathname)) {
            toast.error("Authentication required", {
              description: "Please sign in to access this page"
            });
          }
        }
      } catch (err) {
        console.error("OrganizationProtectedRoute: Error checking auth status:", err);
        setIsAuthenticated(false);
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    checkAuthStatus();

    // Listen for auth state changes to handle logout immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("OrganizationProtectedRoute: Auth state changed:", event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log("OrganizationProtectedRoute: User signed out, clearing state");
        setIsAuthenticated(false);
        setIsAuthenticating(false);
      } else if (event === 'SIGNED_IN' && session) {
        console.log("OrganizationProtectedRoute: User signed in");
        setIsAuthenticated(true);
        setIsAuthenticating(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
    console.log("OrganizationProtectedRoute: Loading state - authenticating or loading org data");
    return <LoadingFallback />;
  }
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    console.log("OrganizationProtectedRoute: On public route:", location.pathname);
    return <>{children}</>;
  }
  
  // If not authenticated and not on a public route, redirect to auth immediately
  if (!isAuthenticated) {
    console.log("OrganizationProtectedRoute: Not authenticated, redirecting to auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // We can only enforce organization requirements once data has loaded
  if (!initialLoadComplete) {
    console.log("OrganizationProtectedRoute: Organization data still loading...");
    return <LoadingFallback />;
  }
  
  // Important change: Redirect users with organizations away from setup page
  if (location.pathname === "/setup" && userOrganizations.length > 0) {
    console.log("OrganizationProtectedRoute: User has organizations but is on setup page, redirecting to dashboard");
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  // Special handling for setup page - only allow when user has no organizations
  if (location.pathname === "/setup") {
    if (userOrganizations.length === 0) {
      console.log("OrganizationProtectedRoute: On setup page with no organizations, allowing access");
      return <>{children}</>;
    }
  }
  
  // For all protected routes except setup, enforce organization context
  if (!currentOrganization && !isPublicRoute(location.pathname)) {
    if (userOrganizations.length > 0) {
      // This shouldn't happen as the enforcer should have selected an organization,
      // but just in case, redirect to dashboard
      console.log("OrganizationProtectedRoute: No current organization but has organizations, redirecting to dashboard");
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    } else {
      console.log("OrganizationProtectedRoute: No organization context, redirecting to setup");
      return <Navigate to="/setup" state={{ from: location }} replace />;
    }
  }
  
  // User is authenticated and has organization context (or is on a public route)
  console.log("OrganizationProtectedRoute: Rendering protected content");
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
