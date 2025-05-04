
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
    const checkAuthAndOrg = async () => {
      console.log("Checking auth and org status");
      
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
        navigate("/auth");
        return;
      }
      
      // If authenticated but no organization context is available (after loading is complete)
      if (!loading && !currentOrganization && userOrganizations.length === 0) {
        console.log("Authenticated but no organization context");
        
        // EMERGENCY FIX: Skipping invitation check completely to prevent redirection loops
        // Just redirect to setup page directly without checking invitations
        console.log("EMERGENCY FIX: Bypassing invitation check, sending to setup");
        navigate("/setup");
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
