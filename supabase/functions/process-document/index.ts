
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Check if it's a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'unknown';
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get file data
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(fileBytes);
    const fileType = file.type;
    const fileName = file.name;
    
    // Upload file to storage
    const storagePath = `uploads/${Date.now()}_${fileName}`;
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('medical-documents')
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });
      
    if (storageError) {
      console.error('Storage upload error:', storageError);
      return new Response(JSON.stringify({ error: 'Failed to upload file to storage' }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Create document record in database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: fileName,
        file_path: storagePath,
        mime_type: fileType,
        status: 'processing',
        document_type: documentType  // Use the new column
      })
      .select()
      .single();
      
    if (documentError) {
      console.error('Document insert error:', documentError);
      return new Response(JSON.stringify({ error: 'Failed to create document record' }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Start document processing in background (mock for now)
    // In a real implementation, you'd call an AI service here
    // This simulates an asynchronous process that will update the document status later
    const documentId = documentData.id;
    
    // Simulate processing by updating the document after a delay
    // In a real implementation, this would be handled by a background job or webhook
    setTimeout(async () => {
      try {
        // Simulate AI extraction results
        const extractedData = {
          structured_data: {
            patient: {
              name: "John Doe",
              employee_id: "EMP123456",
              date_of_birth: "1980-01-15",
              gender: "Male"
            },
            examination: {
              date: "2023-05-10",
              doctor: "Dr. Sarah Johnson",
              clinic: "HealthCare Medical Center",
              findings: [
                "Blood pressure: 120/80 mmHg",
                "Heart rate: 72 bpm",
                "Respiratory rate: 14/min",
                "Temperature: 98.6°F (37°C)"
              ]
            },
            medical_history: {
              conditions: ["None reported"],
              medications: ["None reported"],
              allergies: ["None reported"]
            },
            conclusion: {
              is_fit: true,
              restrictions: ["None"],
              follow_up: "Annual check-up recommended"
            }
          },
          raw_text: "Medical Examination Form\nPatient: John Doe\nID: EMP123456\nDOB: 1980-01-15\nGender: Male\n\nExamination Date: 2023-05-10\nExaminer: Dr. Sarah Johnson\nClinic: HealthCare Medical Center\n\nVital Signs:\n- Blood pressure: 120/80 mmHg\n- Heart rate: 72 bpm\n- Respiratory rate: 14/min\n- Temperature: 98.6°F (37°C)\n\nMedical History:\n- No significant conditions reported\n- No current medications\n- No known allergies\n\nConclusion:\nThe patient is medically fit for the specified job role.\nNo restrictions applied.\nAnnual check-up recommended."
        };

        // Update document status to processed
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            status: 'processed',
            extracted_data: extractedData
          })
          .eq('id', documentId);
          
        if (updateError) {
          console.error('Document update error:', updateError);
        }
      } catch (error) {
        console.error('Processing error:', error);
        
        // Update document to failed status
        await supabase
          .from('documents')
          .update({
            status: 'failed',
            processing_error: 'Internal processing error'
          })
          .eq('id', documentId);
      }
    }, 3000); // 3 second delay for testing

    // Return success with the document ID for client-side polling
    return new Response(JSON.stringify({
      status: 'processing',
      documentId: documentId,
      message: 'Document uploaded and processing started'
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Global error:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
