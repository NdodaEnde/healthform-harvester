
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useOrganizationEnforcer, isPublicRoute } from "@/utils/organizationContextEnforcer";
import { useAuth } from "@/contexts/AuthContext";
import LoadingFallback from "./LoadingFallback";

interface OrganizationProtectedRouteProps {
  children: ReactNode;
}

const OrganizationProtectedRoute = ({ children }: OrganizationProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentOrganization, loading } = useOrganizationEnforcer();
  const { session, loading: authLoading } = useAuth();
  
  // Don't enforce organization context on public routes
  if (isPublicRoute(location.pathname)) {
    return <>{children}</>;
  }
  
  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      console.log("Protected route - not authenticated, redirecting to auth");
      navigate("/auth");
    }
  }, [session, authLoading, navigate]);
  
  // Show loading state while checking auth and organization context
  if (authLoading || loading) {
    return <LoadingFallback />;
  }
  
  // If user is not authenticated, redirect to login
  if (!session) {
    return <Navigate to="/auth" />;
  }
  
  // If there's no organization context, the useOrganizationEnforcer hook will handle the redirect
  if (!currentOrganization) {
    return <LoadingFallback />;
  }
  
  // User is authenticated and has organization context
  return <>{children}</>;
};

export default OrganizationProtectedRoute;
