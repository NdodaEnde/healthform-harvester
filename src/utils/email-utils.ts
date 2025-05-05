
import { supabase } from "@/integrations/supabase/client";

export const sendInvitationEmail = async (
  email: string, 
  organizationName: string, 
  token: string
) => {
  try {
    // Generate the full invitation URL with the correct path
    // Add the origin dynamically to work in both development and production
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    console.log(`Sending invitation email to ${email} for organization ${organizationName}`);
    console.log(`Invitation URL: ${inviteUrl}`);
    
    // Get the access token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No authenticated session found");
    }
    
    // Use the SUPABASE_URL from import.meta.env or fallback to the hardcoded URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wgkbsiczgyaqmgoyirjs.supabase.co';
    
    // Call the Supabase Edge Function to send the email
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        email,
        organizationName,
        token,
        inviteUrl
      })
    });
    
    // Parse the response
    const result = await response.json();
    
    // Check if we should use manual sharing
    if (result.manualSharing) {
      return { 
        success: false, 
        error: "Email sending bypassed - Please share the invitation link manually", 
        inviteUrl: result.inviteUrl || inviteUrl,
        manualSharing: true
      };
    }
    
    if (!response.ok || !result.success) {
      console.error("Error response from email function:", result);
      
      // Always include the invite URL in the response regardless of error
      return { 
        success: false, 
        error: result.error || 'Failed to send invitation email',
        inviteUrl: result.inviteUrl || inviteUrl
      };
    }
    
    // Return the successful response
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    // Return the invitation URL in case of error so it can be used manually
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    return { 
      success: false, 
      error, 
      inviteUrl 
    };
  }
};

export const generateInvitationToken = () => {
  // Generate a more reliable random string for the token (22 chars)
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  
  // Convert to base64 string and remove non-alphanumeric characters
  // Use a safer approach to convert bytes to string
  let token = '';
  for (let i = 0; i < randomBytes.length; i++) {
    token += String.fromCharCode(randomBytes[i]);
  }
  
  // Encode to base64 and clean up
  token = btoa(token)
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, 22);
  
  console.log("Generated invitation token:", token);  
  return token;
};
