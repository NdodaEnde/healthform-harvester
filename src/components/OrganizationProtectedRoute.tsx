
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import { useAuth } from "@/contexts/AuthContext";
import LoadingFallback from "./LoadingFallback";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const { currentOrganization, loading: orgLoading } = useOrganizationEnforcer();
  const { session, loading: authLoading } = useAuth();
  
  const inPreviewMode = window.location.href.includes('/preview') || 
                       window.location.href.includes('preview=true');
  
  if (isPublicRoute(location.pathname) || inPreviewMode) {
    return <>{children}</>;
  }
  
  if (authLoading || orgLoading) {
    return <LoadingFallback />;
  }
  
  if (!session) {
    return <Navigate to="/auth" />;
  }
  
  if (!currentOrganization) {
    return <LoadingFallback />;
  }
  
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
