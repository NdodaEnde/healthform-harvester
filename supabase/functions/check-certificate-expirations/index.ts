
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date();
    // Get dates for 30, 14, and 7 days from now
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const fourteenDaysFromNow = new Date(now);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    console.log("Checking for certificates expiring soon...");
    
    // Find certificates that expire soon and haven't had notifications sent
    const { data: expiringCertificates, error } = await supabase
      .from("certificate_expirations")
      .select(`
        id,
        certificate_id,
        patient_id,
        organization_id,
        expires_at,
        notification_sent,
        certificates:certificate_id (
          patient_info
        ),
        patients:patient_id (
          first_name,
          last_name,
          organization_id
        )
      `)
      .eq("notification_sent", false)
      .lt("expires_at", thirtyDaysFromNow.toISOString());
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${expiringCertificates?.length || 0} certificates expiring soon`);
    
    // Process each expiring certificate
    const notificationPromises = expiringCertificates?.map(async (exp) => {
      try {
        // Determine urgency based on expiration date
        const expiresAt = new Date(exp.expires_at);
        let urgency = "low"; // 30 days
        
        if (expiresAt <= sevenDaysFromNow) {
          urgency = "high"; // 7 days
        } else if (expiresAt <= fourteenDaysFromNow) {
          urgency = "medium"; // 14 days
        }
        
        // Find organization users who should be notified
        const { data: orgUsers } = await supabase
          .from("organization_users")
          .select("user_id, role")
          .eq("organization_id", exp.organization_id);
        
        if (!orgUsers || orgUsers.length === 0) {
          console.log(`No users found for organization ${exp.organization_id}`);
          return null;
        }
        
        // Create notifications for admin users
        const adminUsers = orgUsers.filter(user => ["admin", "superadmin"].includes(user.role));
        const patientName = `${exp.patients?.first_name} ${exp.patients?.last_name}`;
        const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const notificationBatch = adminUsers.map(user => ({
          user_id: user.user_id,
          organization_id: exp.organization_id,
          title: `Certificate Expiring Soon`,
          message: `The certificate for ${patientName} will expire in ${daysUntilExpiration} days (${expiresAt.toLocaleDateString()}).`,
          type: `certificate_expiration_${urgency}`,
          data: {
            certificate_id: exp.certificate_id,
            url: `/certificates/${exp.certificate_id}`,
            patient_id: exp.patient_id,
            expires_at: exp.expires_at,
            urgency
          }
        }));
        
        // Insert notifications
        if (notificationBatch.length > 0) {
          const { error: insertError } = await supabase
            .from("notifications")
            .insert(notificationBatch);
          
          if (insertError) {
            console.error("Error creating notifications:", insertError);
            return null;
          }
          
          // Mark as notified
          const { error: updateError } = await supabase
            .from("certificate_expirations")
            .update({ notification_sent: true })
            .eq("id", exp.id);
          
          if (updateError) {
            console.error("Error updating expiration record:", updateError);
            return null;
          }
          
          return {
            certificate_id: exp.certificate_id,
            notifications_sent: notificationBatch.length,
            urgency
          };
        }
        
        return null;
      } catch (certError) {
        console.error(`Error processing certificate ${exp.certificate_id}:`, certError);
        return null;
      }
    }) || [];
    
    // Wait for all notifications to be processed
    const results = await Promise.all(notificationPromises);
    const successfulNotifications = results.filter(Boolean);
    
    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: successfulNotifications.length,
        details: successfulNotifications
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in check-certificate-expirations function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
