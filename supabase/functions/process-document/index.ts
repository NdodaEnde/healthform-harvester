
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
        document_type: documentType
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

    // Get a URL for the uploaded file
    const { data: fileUrl } = await supabase
      .storage
      .from('medical-documents')
      .createSignedUrl(storagePath, 3600);
      
    if (!fileUrl?.signedUrl) {
      throw new Error('Could not generate signed URL for file');
    }

    // Start document processing in background using OpenAI
    const documentId = documentData.id;
    
    // Start processing in background
    processDocumentWithAI(documentId, fileUrl.signedUrl, documentType, supabase);

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

// Function to process document with AI in the background
async function processDocumentWithAI(documentId: string, fileUrl: string, documentType: string, supabase: any) {
  try {
    console.log(`Starting AI document processing for document ID: ${documentId}`);
    
    // Get OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // First, extract the text from the document using GPT-4 Vision
    const extractionPrompt = getPromptForDocumentType(documentType);
    
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI specialized in extracting structured information from medical documents. Extract all relevant information from the image.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: extractionPrompt },
              { type: 'image_url', image_url: { url: fileUrl } }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.json();
      console.error('OpenAI Vision API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.choices[0].message.content;

    // Now, structure the extracted text into a structured JSON format
    const structuringResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: getStructuringPromptForDocumentType(documentType)
          },
          {
            role: 'user',
            content: extractedText
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!structuringResponse.ok) {
      const errorData = await structuringResponse.json();
      console.error('OpenAI Structuring API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const structuredData = await structuringResponse.json();
    const parsedStructuredData = JSON.parse(structuredData.choices[0].message.content);

    // Combine both raw text and structured data
    const extractedData = {
      raw_text: extractedText,
      structured_data: parsedStructuredData
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
      console.error('Failed to update document with extracted data:', updateError);
      throw updateError;
    }
    
    console.log(`Document processing completed for document ID: ${documentId}`);
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document to failed status
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        processing_error: error.message || 'AI processing error'
      })
      .eq('id', documentId);
  }
}

function getPromptForDocumentType(documentType: string): string {
  if (documentType === 'medical-questionnaire') {
    return `
      This appears to be a Medical Examination Questionnaire. Please extract all information from it, including:
      - Patient personal details (name, ID, date of birth, gender, etc.)
      - Medical history information
      - Current health status
      - Examination results
      - Vital signs
      - Any diagnoses or recommendations
      
      Capture as much detail as possible from the document.
    `;
  } else if (documentType === 'certificate-fitness') {
    return `
      This appears to be a Certificate of Fitness. Please extract all information from it, including:
      - Patient's full name and ID
      - Doctor's name and qualifications
      - Date of examination
      - Fitness decision (fit/unfit for duty)
      - Any restrictions or recommendations
      - Validity period of the certificate
      - Medical facility information
      
      Capture all fields and details present in the document.
    `;
  } else {
    return `
      Please analyze this medical document carefully and extract all information present, including:
      - Any personal identification information
      - Medical data and findings
      - Dates and timestamps
      - Professional assessments and recommendations
      
      Be thorough and capture all details from the document.
    `;
  }
}

function getStructuringPromptForDocumentType(documentType: string): string {
  if (documentType === 'medical-questionnaire') {
    return `
      You are an AI specialized in structuring medical data. Take the extracted text from a Medical Examination Questionnaire and organize it into a structured JSON format.
      
      The JSON should have this structure:
      {
        "patient": {
          "name": "",
          "id": "",
          "employee_id": "",
          "date_of_birth": "",
          "gender": "",
          "contact_information": {
            "phone": "",
            "email": "",
            "address": ""
          }
        },
        "medical_history": {
          "allergies": [],
          "current_medications": [],
          "chronic_conditions": [],
          "previous_surgeries": [],
          "family_history": {}
        },
        "vital_signs": {
          "height": "",
          "weight": "",
          "bmi": "",
          "blood_pressure": "",
          "heart_rate": "",
          "respiratory_rate": "",
          "temperature": "",
          "oxygen_saturation": ""
        },
        "examination_results": {
          "vision": "",
          "hearing": "",
          "cardiovascular": "",
          "respiratory": "",
          "gastrointestinal": "",
          "musculoskeletal": "",
          "neurological": "",
          "other_findings": []
        },
        "assessment": {
          "diagnoses": [],
          "recommendations": [],
          "restrictions": [],
          "fitness_conclusion": ""
        },
        "examination_details": {
          "date": "",
          "location": "",
          "examiner": "",
          "next_examination_due": ""
        }
      }
      
      Fill in all fields based on available information. Use null for missing data. Include any additional information in appropriate fields or add new fields if necessary.
    `;
  } else if (documentType === 'certificate-fitness') {
    return `
      You are an AI specialized in structuring medical certification data. Take the extracted text from a Certificate of Fitness and organize it into a structured JSON format.
      
      The JSON should have this structure:
      {
        "patient": {
          "name": "",
          "id": "",
          "employee_id": "",
          "date_of_birth": "",
          "gender": ""
        },
        "certificate": {
          "issue_date": "",
          "expiry_date": "",
          "fitness_status": "",
          "restrictions": [],
          "recommendations": []
        },
        "examination_details": {
          "date": "",
          "location": "",
          "facility_name": "",
          "facility_address": ""
        },
        "medical_professional": {
          "name": "",
          "title": "",
          "license_number": "",
          "signature_present": false
        },
        "job_details": {
          "position": "",
          "department": "",
          "company": "",
          "job_requirements": []
        }
      }
      
      Fill in all fields based on available information. Use null for missing data. Include any additional information in appropriate fields or add new fields if necessary.
    `;
  } else {
    return `
      You are an AI specialized in structuring medical data. Take the extracted text from the medical document and organize it into a structured JSON format.
      
      Create an appropriate JSON structure based on the type of document and the information present. Include all relevant sections like patient information, medical findings, assessments, and recommendations.
      
      Be thorough and make sure all important information is included in your structured output.
    `;
  }
}
