
import { supabase } from "@/integrations/supabase/client";

export const sendInvitationEmail = async (
  email: string, 
  organizationName: string, 
  token: string
) => {
  // In a production app, this would send an actual email using a service like SendGrid
  // For demo purposes, we'll log it to the console
  console.log(`Sending invitation email to ${email} for organization ${organizationName}`);
  console.log(`Invitation URL: ${window.location.origin}/auth/accept-invite?token=${token}`);
  
  // Return success for now - in a real app, this would be the email service response
  return { success: true };
};

export const generateInvitationToken = () => {
  // Generate a random string for the token
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Sends a certificate as a PDF attachment via email
 * @param toEmail Recipient email address
 * @param subject Email subject
 * @param pdfBlob The certificate PDF as a Blob
 * @param patientName Patient's name for the email body
 * @param certificateType Type of certificate being sent
 * @returns Promise that resolves with the response from the email service
 */
export const sendCertificateEmail = async (
  toEmail: string,
  subject: string,
  pdfBlob: Blob,
  patientName: string,
  certificateType: string
) => {
  try {
    // Convert blob to base64 for sending
    const base64pdf = await blobToBase64(pdfBlob);
    
    // In a production app, this would call a Supabase Edge Function to send the email
    // For demo purposes, we'll just log it and simulate success
    console.log(`Sending certificate email to ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Patient: ${patientName}`);
    console.log(`Certificate Type: ${certificateType}`);
    console.log(`PDF size: ${Math.round(base64pdf.length / 1024)} KB`);
    
    // In a real implementation, we would call:
    // const { data, error } = await supabase.functions.invoke('send-certificate-email', {
    //   body: { toEmail, subject, pdfBase64: base64pdf, patientName, certificateType }
    // });
    
    // Simulate success response
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending certificate email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Helper function to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Get only the base64 part, removing the prefix "data:application/pdf;base64,"
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
