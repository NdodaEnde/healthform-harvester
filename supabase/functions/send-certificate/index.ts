
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SendCertificateRequest {
  certificateId: string;
  recipientEmail: string;
  organizationId: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificateId, recipientEmail, organizationId, subject, message } = await req.json() as SendCertificateRequest;

    // Validate inputs
    if (!certificateId || !recipientEmail || !organizationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get certificate data
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .single();

    if (certError) {
      console.error("Error fetching certificate:", certError);
      return new Response(
        JSON.stringify({ error: "Certificate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization data for branding
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("name, logo_url, contact_email")
      .eq("id", organizationId)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In a real implementation, you would use an email service like Resend, SendGrid, etc.
    // For now, we'll just log the email content and return a success message
    console.log("Email would be sent with the following details:");
    console.log("From:", organization.contact_email || "noreply@example.com");
    console.log("To:", recipientEmail);
    console.log("Subject:", subject);
    console.log("Message:", message);
    console.log("Certificate ID:", certificateId);
    console.log("Organization:", organization.name);
    
    // Create a record of this email being sent
    const { error: logError } = await supabase
      .from("email_logs")
      .insert({
        certificate_id: certificateId,
        recipient_email: recipientEmail,
        organization_id: organizationId,
        subject: subject,
        message: message,
        status: "sent"
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Certificate email would be sent in a production environment" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in send-certificate function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
