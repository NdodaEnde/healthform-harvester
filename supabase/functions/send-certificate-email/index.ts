
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateEmailRequest {
  toEmail: string;
  subject: string;
  pdfBase64: string;
  patientName: string;
  certificateType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { toEmail, subject, pdfBase64, patientName, certificateType } = await req.json() as CertificateEmailRequest;
    
    // Validate inputs
    if (!toEmail || !subject || !pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log(`Received request to send certificate email to ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Patient: ${patientName}`);
    console.log(`Certificate Type: ${certificateType}`);
    console.log(`PDF size: ${Math.round(pdfBase64.length / 1024)} KB`);
    
    // TODO: Implement actual email sending functionality using a service like Resend, SendGrid, etc.
    // This will require:
    // 1. Setting up the necessary env variables in Supabase
    // 2. Implementing the actual email sending code
    // 3. Configuring the email template
    
    // Example with Resend (uncomment and configure when ready):
    /*
    import { Resend } from 'npm:resend@1.0.0';
    
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailResponse = await resend.emails.send({
      from: 'Your Service <certificates@yourdomain.com>',
      to: [toEmail],
      subject: subject,
      html: `
        <h1>Medical Certificate for ${patientName}</h1>
        <p>Please find attached the ${certificateType} for ${patientName}.</p>
        <p>This is an automatically generated email, please do not reply.</p>
      `,
      attachments: [
        {
          filename: `certificate-${patientName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    });
    
    console.log('Email sent with Resend:', emailResponse);
    */
    
    // For now, simulate success
    const mockResponse = { 
      success: true, 
      message: 'Email delivery simulated. In production, configure this function with your email service provider.' 
    };
    
    return new Response(
      JSON.stringify(mockResponse),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error('Error in send-certificate-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});
