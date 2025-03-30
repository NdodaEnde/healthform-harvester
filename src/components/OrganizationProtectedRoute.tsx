
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import LoadingFallback from "./LoadingFallback";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    return <>{children}</>;
  }
  
  // Show loading state while checking auth and organization context
  if (loading) {
    return <LoadingFallback />;
  }
  
  // If there's no organization context, the useOrganizationEnforcer hook will handle the redirect
  if (!currentOrganization) {
    // Return a loading state while the redirection is happening
    return <LoadingFallback />;
  }
  
  // User is authenticated and has organization context
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
