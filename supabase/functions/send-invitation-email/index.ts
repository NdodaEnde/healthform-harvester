
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  email: string;
  organizationName: string;
  token: string;
  inviteUrl: string;
}

async function sendEmail(payload: EmailPayload) {
  try {
    const { email, organizationName, token, inviteUrl } = payload;
    
    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFromAddress = Deno.env.get("EMAIL_FROM") || "noreply@medicdata.co.za";
    
    // Log configuration for debugging
    console.log("Email Configuration:");
    console.log("- Using Resend API");
    console.log("- API Key exists:", !!resendApiKey);
    console.log("- Sending to:", email);
    console.log("- Using from email:", emailFromAddress);
    console.log("- Token:", token);
    console.log("- Invitation URL:", inviteUrl);
    
    // Check if we should bypass email sending for testing
    const bypassEmail = Deno.env.get("BYPASS_EMAIL_SENDING") === "true";
    if (bypassEmail) {
      console.log("Email sending bypassed due to BYPASS_EMAIL_SENDING environment variable");
      return {
        success: true, // Changed to true to prevent error state in UI
        message: "Email sending bypassed - Please share the invitation link manually",
        inviteUrl,
        manualSharing: true
      };
    }
    
    // If no API key is available, return invitation URL for manual sharing
    if (!resendApiKey) {
      console.warn("Resend API key not configured. Returning invitation URL for manual sharing.");
      return {
        success: true, // Changed to true to prevent error state in UI
        message: "Email sending bypassed - Please share the invitation link manually",
        inviteUrl,
        manualSharing: true
      };
    }
    
    // Email HTML content - Ensure link is using the correct path
    const htmlContent = `
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border: 1px solid #e0e0e0; border-radius: 5px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #4a5568; margin-top: 0;">HealthForm Harvester Invitation</h1>
          <p>Hello,</p>
          <p>You have been invited to join <strong>${organizationName}</strong> on HealthForm Harvester.</p>
          <p>Please click the link below to accept this invitation:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="margin-bottom: 0;">If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p style="background-color: #f7fafc; padding: 10px; border-radius: 4px; font-size: 14px; word-break: break-all;">${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <p style="color: #718096; font-size: 13px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e0e0e0;">If you did not request this invitation, please ignore this email.</p>
          <p style="color: #718096; font-size: 12px; text-align: center; margin-top: 20px;">HealthForm Harvester &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
    
    // Format the from address properly for Resend
    const fromAddress = emailFromAddress.includes("<") 
      ? emailFromAddress 
      : `HealthForm Harvester <${emailFromAddress}>`;
    
    // Use Resend API to send the email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Invitation to join ${organizationName} on HealthForm Harvester`,
        html: htmlContent
      })
    });
    
    const result = await response.json();
    console.log("Resend API response:", JSON.stringify(result));
    
    // Check if the email was sent successfully
    if (response.ok && result.id) {
      console.log("Email sent successfully with Resend:", result.id);
      return {
        success: true,
        message: "Invitation email sent successfully",
        emailId: result.id
      };
    } else {
      console.error("Failed to send email with Resend:", result);
      return {
        success: true, // Changed to true to prevent error state in UI since we're showing manual option
        message: result.message || "Failed to send email - Please share the invitation link manually",
        error: result,
        inviteUrl, // Include the invite URL for manual sharing
        manualSharing: true
      };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: true, // Changed to true to prevent error state in UI since we're showing manual option
      message: "Error sending email - Please share the invitation link manually",
      error: error,
      inviteUrl: payload.inviteUrl, // Include the invite URL for manual sharing
      manualSharing: true
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the request payload
    const payload = await req.json() as EmailPayload;
    console.log("Received email payload:", {
      email: payload.email,
      organizationName: payload.organizationName,
      token: payload.token,
      inviteUrl: payload.inviteUrl
    });
    
    if (!payload.email || !payload.organizationName || !payload.token || !payload.inviteUrl) {
      throw new Error("Missing required fields");
    }
    
    // Send the email
    const result = await sendEmail(payload);
    
    // Always return 200 with appropriate data, even if sending failed
    // This makes it easier for clients to handle the response
    return new Response(
      JSON.stringify({ 
        success: result.success,
        message: result.message,
        inviteUrl: payload.inviteUrl,
        manualSharing: result.manualSharing || false,
        emailId: result.emailId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to process invitation email" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
