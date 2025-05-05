
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
    switchOrganization
  } = useOrganization();

  useEffect(() => {
    // Track if we've initiated a navigation to avoid redirection loops
    let isNavigating = false;
    
    const checkAuthAndOrg = async () => {
      // Skip if we're already navigating
      if (isNavigating) {
        console.log("Navigation already in progress, skipping additional checks");
        return;
      }
      
      // Skip enforcer if we're on setup or accept-invite pages
      const currentPath = window.location.pathname;
      if (currentPath === "/setup" || currentPath.startsWith("/accept-invite")) {
        console.log("On setup or accept-invite page, skipping enforcer");
        return;
      }
      
      // Check if we just accepted an invitation - if so, avoid redirection loops
      const justAcceptedInvitation = localStorage.getItem("invitation_just_accepted");
      if (justAcceptedInvitation === "true") {
        console.log("Invitation was just accepted, skipping enforcer checks");
        localStorage.removeItem("invitation_just_accepted"); // Clear the flag
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not authenticated, redirect to auth page
      if (!session) {
        console.log("No session found, redirecting to auth");
        isNavigating = true;
        navigate("/auth");
        return;
      }
      
      // Skip if organization data is still loading
      if (loading) {
        console.log("Organizations still loading, waiting...");
        return;
      }
      
      // If authenticated but no organization data (after loading is complete)
      if (!currentOrganization && userOrganizations.length === 0) {
        console.log("Authenticated but no organizations, redirecting to setup");
        isNavigating = true;
        navigate("/setup");
        return;
      } 
      
      // If user has organizations but none is selected, select the first one
      if (!currentOrganization && userOrganizations.length > 0) {
        console.log("User has organizations but none selected, selecting first one");
        switchOrganization(userOrganizations[0].id);
        return;
      }

      // If we're on the setup page but already have an organization, redirect to dashboard
      if (currentPath === "/setup" && currentOrganization) {
        console.log("Already have organization but on setup page, redirecting to dashboard");
        isNavigating = true;
        navigate("/dashboard");
        return;
      }
    };
    
    checkAuthAndOrg();
  }, [currentOrganization, userOrganizations, loading, navigate, switchOrganization]);
  
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
