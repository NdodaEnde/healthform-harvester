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
    initialLoadComplete,
    switchOrganization
  } = useOrganization();

  useEffect(() => {
    // Skip if data hasn't loaded yet - THIS IS CRITICAL
    if (!initialLoadComplete || loading) {
      console.log("OrganizationEnforcer: Organization data still initializing, waiting...", { 
        initialLoadComplete, 
        loading, 
        userOrganizations: userOrganizations.length 
      });
      return;
    }

    // Track if we've initiated a navigation to avoid redirection loops
    let isNavigating = false;
    
    const checkAuthAndOrg = async () => {
      // Skip if we're already navigating
      if (isNavigating) {
        console.log("OrganizationEnforcer: Navigation already in progress, skipping additional checks");
        return;
      }
      
      // Skip enforcer if we're on setup or accept-invite pages
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/accept-invite") || currentPath === "/setup") {
        console.log("OrganizationEnforcer: On special page, skipping enforcer:", currentPath);
        return;
      }
      
      // Check if we just accepted an invitation - if so, avoid redirection loops
      const justAcceptedInvitation = localStorage.getItem("invitation_just_accepted");
      if (justAcceptedInvitation === "true") {
        console.log("OrganizationEnforcer: Invitation was just accepted, skipping enforcer checks");
        localStorage.removeItem("invitation_just_accepted"); // Clear the flag
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not authenticated, redirect to auth page
      if (!session) {
        console.log("OrganizationEnforcer: No session found, redirecting to auth");
        isNavigating = true;
        navigate("/auth");
        return;
      }
      
      console.log("OrganizationEnforcer: Session exists, checking organization state");
      console.log("OrganizationEnforcer: Current organization:", currentOrganization?.name || "None");
      console.log("OrganizationEnforcer: User organizations count:", userOrganizations.length);
      console.log("OrganizationEnforcer: Loading states:", { loading, initialLoadComplete });
      
      // CRITICAL: Only make decisions after data is fully loaded
      if (userOrganizations.length > 0) {
        // User has organizations - ensure one is selected
        if (!currentOrganization) {
          console.log("OrganizationEnforcer: User has organizations but none selected, selecting first one");
          switchOrganization(userOrganizations[0].id);
          return;
        }
        
        // If on setup page but user has organizations, redirect to dashboard
        if (currentPath === "/setup") {
          console.log("OrganizationEnforcer: User has organizations but on setup page, redirecting to dashboard");
          isNavigating = true;
          navigate("/dashboard");
          return;
        }
      } else {
        // User has no organizations - should be on setup page
        if (currentPath !== "/setup") {
          console.log("OrganizationEnforcer: Authenticated but no organizations, redirecting to setup");
          isNavigating = true;
          navigate("/setup");
          return;
        }
      }
      
      console.log("OrganizationEnforcer: All checks passed, no action needed");
    };
    
    checkAuthAndOrg();
  }, [currentOrganization, userOrganizations, loading, initialLoadComplete, navigate, switchOrganization]);
  
  return { currentOrganization, loading: loading || !initialLoadComplete };
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
