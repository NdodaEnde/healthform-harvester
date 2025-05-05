
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// This hook enforces organization context throughout the application
export const useOrganizationEnforcer = () => {
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    userOrganizations, 
    loading,
  } = useOrganization();

  useEffect(() => {
    // Track if we've initiated a navigation to avoid redirection loops
    let isNavigating = false;
    
    const checkAuthAndOrg = async () => {
      console.log("Checking auth and org status");
      
      // Skip if we've already initiated navigation
      if (isNavigating) {
        console.log("Navigation already in progress, skipping additional checks");
        return;
      }
      
      // EMERGENCY FIX: Skip enforcer if we're on setup or accept-invite pages
      // This prevents the invitation loop bug completely
      const currentPath = window.location.pathname;
      if (currentPath === "/setup" || currentPath.startsWith("/accept-invite")) {
        console.log("EMERGENCY FIX: On setup or accept-invite page, skipping enforcer");
        return;
      }
      
      // Check if we just accepted an invitation - if so, avoid redirection loops
      const justAcceptedInvitation = localStorage.getItem("invitation_just_accepted");
      if (justAcceptedInvitation === "true") {
        console.log("Invitation was just accepted, skipping enforcer checks");
        localStorage.removeItem("invitation_just_accepted"); // Clear the flag
        return; // Skip the rest of the checks to avoid loops
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not authenticated, redirect to auth page
      if (!session) {
        console.log("No session found, redirecting to auth");
        isNavigating = true;
        navigate("/auth");
        return;
      }
      
      // Wait until organization data is fully loaded
      if (loading) {
        console.log("Organizations still loading, waiting...");
        return;
      }
      
      // If authenticated but no organization context is available (after loading is complete)
      if (!currentOrganization && userOrganizations.length === 0) {
        console.log("Authenticated but no organization context, redirecting to setup");
        isNavigating = true;
        navigate("/setup");
        return;
      } else if (!currentOrganization && userOrganizations.length > 0) {
        console.log("User has organizations but none selected, redirecting to dashboard");
        isNavigating = true;
        navigate("/dashboard");
        return;
      }
    };
    
    checkAuthAndOrg();
  }, [currentOrganization, userOrganizations, loading, navigate]);
  
  return { currentOrganization, loading };
};

// Public routes that don't require organization context
export const PUBLIC_ROUTES = [
  "/", 
  "/auth", 
  "/auth/callback", 
  "/callback",
  "/accept-invite", 
  "/reset-password", 
  "/update-password", 
  "/setup",
  "/privacy",
  "/terms",
  "/document" // Adding this to handle potential URL mismatch redirections
];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string) => {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`) || 
    // Special case to handle document routes
    (pathname.startsWith('/document/') && route === '/document')
  );
};
