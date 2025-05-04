
import { toast } from "@/components/ui/use-toast";

// This is a mock API client for features that would normally require a backend API
// In a production environment, these would be replaced with actual API calls

export async function mockInviteUser(data: { 
  email: string; 
  organizationId: string; 
  role: string 
}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate success (90% of the time)
  if (Math.random() > 0.1) {
    console.log("MOCK API - Invite user:", data);
    return {
      success: true,
      message: "Invitation sent successfully"
    };
  }
  
  // Simulate error (10% of the time)
  throw new Error("Failed to send invitation. Server error.");
}

// Helper to show consistent API error messages
export function handleApiError(error: any, defaultMessage = "An unexpected error occurred") {
  console.error("API Error:", error);
  
  const errorMessage = error?.message || defaultMessage;
  
  toast({
    title: "Error",
    description: errorMessage,
    variant: "destructive",
  });
}
