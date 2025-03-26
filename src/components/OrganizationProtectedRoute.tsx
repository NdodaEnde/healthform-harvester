
import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import LoadingFallback from "./LoadingFallback";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Helper to detect preview mode
  const isInPreviewMode = () => {
    const url = window.location.href;
    return url.includes('/preview') || url.includes('preview=true');
  };
  
  // Add a brief initialization delay to prevent flash of redirect
  useEffect(() => {
    console.log("OrganizationProtectedRoute initializing for path:", location.pathname);
    console.log("Preview mode:", isInPreviewMode() ? "Yes" : "No");
    
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    console.log("Public route detected, allowing access:", location.pathname);
    return <>{children}</>;
  }
  
  // In preview mode, bypass auth checks
  if (isInPreviewMode()) {
    console.log("Preview mode detected, bypassing organization checks");
    return <>{children}</>;
  }
  
  // Show loading state while checking auth and organization context
  // or during initial render to prevent flash of redirect
  if (loading || isInitializing) {
    return <LoadingFallback />;
  }
  
  // If there's no organization context, the useOrganizationEnforcer hook will handle the redirect
  if (!currentOrganization) {
    console.log("No organization context, loading fallback while redirect happens");
    // Return a loading state while the redirection is happening
    return <LoadingFallback />;
  }
  
  // User is authenticated and has organization context
  console.log("Organization context verified, rendering protected content");
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
