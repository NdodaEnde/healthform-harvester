
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// LandingAI API configuration
const LANDINGAI_API_URL = "https://api.va.landing.ai/v1/tools/agentic-document-analysis";
const LANDINGAI_API_KEY = "bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5";

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
    
    // Create a storage bucket if it doesn't exist yet
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('medical-documents');
      
      if (bucketError && bucketError.message.includes('not found')) {
        await supabase.storage.createBucket('medical-documents', {
          public: false,
        });
      }
    } catch (error) {
      console.log('Bucket check error, proceeding anyway:', error);
    }
    
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
      return new Response(JSON.stringify({ error: 'Failed to upload file to storage', details: storageError }), {
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
      return new Response(JSON.stringify({ error: 'Failed to create document record', details: documentError }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Start document processing in background
    const documentId = documentData.id;
    
    // Start processing in background
    processDocumentWithLandingAI(documentId, fileBuffer, fileType, documentType, supabase);

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
    
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

// Function to process document with LandingAI in the background
async function processDocumentWithLandingAI(
  documentId: string, 
  fileBuffer: Uint8Array, 
  fileType: string, 
  documentType: string, 
  supabase: any
) {
  try {
    console.log(`Starting LandingAI document processing for document ID: ${documentId}`);

    // Prepare form data for the API request
    const landingAIFormData = new FormData();
    
    // Determine if it's a PDF or image
    if (fileType === 'application/pdf') {
      landingAIFormData.append('pdf', new Blob([fileBuffer]), 'document.pdf');
    } else {
      // For images (png, jpeg, etc.)
      landingAIFormData.append('image', new Blob([fileBuffer]), 'document.png');
    }

    // Send request to LandingAI API
    const response = await fetch(LANDINGAI_API_URL, {
      method: 'POST',
      body: landingAIFormData,
      headers: {
        'Authorization': `Basic ${LANDINGAI_API_KEY}`
      }
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `API request failed: ${JSON.stringify(errorData)}`;
      } catch (e) {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage);
    }

    // Parse response from LandingAI
    const apiResult = await response.json();
    console.log('LandingAI API response received');
    
    // Process and structure the data based on document type
    const extractedData = processApiResult(apiResult, documentType);

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

// Process and structure the API result based on document type
function processApiResult(apiResult: any, documentType: string): any {
  // Store the complete API result as raw data
  const rawData = apiResult;
  
  // Create a structured format based on document type
  let structuredData: any = {};
  
  try {
    // Extract common fields first
    structuredData = {
      patient: {
        name: extractPatientName(apiResult),
        id: extractPatientId(apiResult),
        employee_id: extractEmployeeId(apiResult),
        date_of_birth: extractDateOfBirth(apiResult),
        gender: extractGender(apiResult)
      }
    };
    
    // Add document-type specific structured data
    if (documentType === 'medical-questionnaire') {
      structuredData = {
        ...structuredData,
        medical_history: extractMedicalHistory(apiResult),
        vital_signs: extractVitalSigns(apiResult),
        examination_results: extractExaminationResults(apiResult),
        assessment: extractAssessment(apiResult),
        examination_details: extractExaminationDetails(apiResult)
      };
    } else if (documentType === 'certificate-fitness') {
      structuredData = {
        ...structuredData,
        certificate: extractCertificateDetails(apiResult),
        examination_details: extractExaminationDetails(apiResult),
        medical_professional: extractMedicalProfessional(apiResult),
        job_details: extractJobDetails(apiResult)
      };
    }
  } catch (error) {
    console.error('Error structuring data:', error);
    // If there's an error, add an error indication but still include the raw data
    structuredData.error = "Error structuring data: " + error.message;
  }
  
  // Return both the raw and structured data
  return {
    raw_data: rawData,
    structured_data: structuredData
  };
}

// Helper functions to extract specific information from the API result
function extractPatientName(apiResult: any): string {
  // Try to find patient name in various places in the data
  try {
    // Look for fields related to names
    if (apiResult.extracted_data && apiResult.extracted_data.name) {
      return apiResult.extracted_data.name;
    }
    
    if (apiResult.patient && apiResult.patient.name) {
      return apiResult.patient.name;
    }
    
    if (apiResult.patient_name) {
      return apiResult.patient_name;
    }
    
    if (apiResult.subject && apiResult.subject.name) {
      return apiResult.subject.name;
    }
    
    // Check for first and last name fields and combine them
    const firstName = apiResult.first_name || 
      (apiResult.patient && apiResult.patient.first_name) || 
      (apiResult.subject && apiResult.subject.first_name);
      
    const lastName = apiResult.last_name || 
      (apiResult.patient && apiResult.patient.last_name) || 
      (apiResult.subject && apiResult.subject.last_name);
      
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // Look through any fields that might contain "name"
    for (const key in apiResult) {
      if (key.toLowerCase().includes('name') && typeof apiResult[key] === 'string') {
        return apiResult[key];
      }
    }
    
    return "Unknown";
  } catch (e) {
    console.error("Error extracting patient name:", e);
    return "Unknown";
  }
}

function extractPatientId(apiResult: any): string {
  try {
    // Look for ID fields
    if (apiResult.patient && apiResult.patient.id) {
      return apiResult.patient.id;
    }
    
    if (apiResult.patient_id) {
      return apiResult.patient_id;
    }
    
    if (apiResult.subject && apiResult.subject.id) {
      return apiResult.subject.id;
    }
    
    // Look for any ID-related fields
    for (const key in apiResult) {
      if ((key.toLowerCase().includes('id') && !key.toLowerCase().includes('employee')) && 
          typeof apiResult[key] === 'string') {
        return apiResult[key];
      }
    }
    
    return "No ID";
  } catch (e) {
    console.error("Error extracting patient ID:", e);
    return "No ID";
  }
}

function extractEmployeeId(apiResult: any): string {
  try {
    if (apiResult.employee_id) {
      return apiResult.employee_id;
    }
    
    if (apiResult.patient && apiResult.patient.employee_id) {
      return apiResult.patient.employee_id;
    }
    
    for (const key in apiResult) {
      if (key.toLowerCase().includes('employee') && key.toLowerCase().includes('id') && 
          typeof apiResult[key] === 'string') {
        return apiResult[key];
      }
    }
    
    return "";
  } catch (e) {
    console.error("Error extracting employee ID:", e);
    return "";
  }
}

function extractDateOfBirth(apiResult: any): string {
  try {
    if (apiResult.date_of_birth || apiResult.dob) {
      return apiResult.date_of_birth || apiResult.dob;
    }
    
    if (apiResult.patient) {
      return apiResult.patient.date_of_birth || apiResult.patient.dob || "";
    }
    
    if (apiResult.subject) {
      return apiResult.subject.date_of_birth || apiResult.subject.dob || "";
    }
    
    for (const key in apiResult) {
      if ((key.toLowerCase().includes('birth') || key.toLowerCase() === 'dob') && 
          typeof apiResult[key] === 'string') {
        return apiResult[key];
      }
    }
    
    return "";
  } catch (e) {
    console.error("Error extracting date of birth:", e);
    return "";
  }
}

function extractGender(apiResult: any): string {
  try {
    if (apiResult.gender || apiResult.sex) {
      return apiResult.gender || apiResult.sex;
    }
    
    if (apiResult.patient) {
      return apiResult.patient.gender || apiResult.patient.sex || "";
    }
    
    if (apiResult.subject) {
      return apiResult.subject.gender || apiResult.subject.sex || "";
    }
    
    return "";
  } catch (e) {
    console.error("Error extracting gender:", e);
    return "";
  }
}

function extractMedicalHistory(apiResult: any): any {
  try {
    if (apiResult.medical_history) {
      return apiResult.medical_history;
    }
    
    // Attempt to construct medical history from various fields
    return {
      allergies: findInApiResult(apiResult, 'allergies', []),
      current_medications: findInApiResult(apiResult, 'medications', []),
      chronic_conditions: findInApiResult(apiResult, 'conditions', []),
      previous_surgeries: findInApiResult(apiResult, 'surgeries', []),
      family_history: findInApiResult(apiResult, 'family_history', {})
    };
  } catch (e) {
    console.error("Error extracting medical history:", e);
    return {};
  }
}

function extractVitalSigns(apiResult: any): any {
  try {
    if (apiResult.vital_signs) {
      return apiResult.vital_signs;
    }
    
    // Attempt to gather vital signs from scattered fields
    return {
      height: findInApiResult(apiResult, 'height', ""),
      weight: findInApiResult(apiResult, 'weight', ""),
      bmi: findInApiResult(apiResult, 'bmi', ""),
      blood_pressure: findInApiResult(apiResult, 'blood_pressure', ""),
      heart_rate: findInApiResult(apiResult, 'heart_rate', ""),
      respiratory_rate: findInApiResult(apiResult, 'respiratory_rate', ""),
      temperature: findInApiResult(apiResult, 'temperature', ""),
      oxygen_saturation: findInApiResult(apiResult, 'oxygen_saturation', "")
    };
  } catch (e) {
    console.error("Error extracting vital signs:", e);
    return {};
  }
}

function extractExaminationResults(apiResult: any): any {
  try {
    if (apiResult.examination_results) {
      return apiResult.examination_results;
    }
    
    if (apiResult.results) {
      return apiResult.results;
    }
    
    // Gather examination results from potential fields
    return {
      vision: findInApiResult(apiResult, 'vision', ""),
      hearing: findInApiResult(apiResult, 'hearing', ""),
      cardiovascular: findInApiResult(apiResult, 'cardiovascular', ""),
      respiratory: findInApiResult(apiResult, 'respiratory', ""),
      gastrointestinal: findInApiResult(apiResult, 'gastrointestinal', ""),
      musculoskeletal: findInApiResult(apiResult, 'musculoskeletal', ""),
      neurological: findInApiResult(apiResult, 'neurological', ""),
      other_findings: []
    };
  } catch (e) {
    console.error("Error extracting examination results:", e);
    return {};
  }
}

function extractAssessment(apiResult: any): any {
  try {
    if (apiResult.assessment) {
      return apiResult.assessment;
    }
    
    return {
      diagnoses: findInApiResult(apiResult, 'diagnoses', []),
      recommendations: findInApiResult(apiResult, 'recommendations', []),
      restrictions: findInApiResult(apiResult, 'restrictions', []),
      fitness_conclusion: findInApiResult(apiResult, 'fitness_conclusion', "")
    };
  } catch (e) {
    console.error("Error extracting assessment:", e);
    return {};
  }
}

function extractExaminationDetails(apiResult: any): any {
  try {
    if (apiResult.examination_details) {
      return apiResult.examination_details;
    }
    
    return {
      date: findInApiResult(apiResult, 'examination_date', ""),
      location: findInApiResult(apiResult, 'examination_location', ""),
      examiner: findInApiResult(apiResult, 'examiner', ""),
      facility_name: findInApiResult(apiResult, 'facility_name', ""),
      facility_address: findInApiResult(apiResult, 'facility_address', ""),
      next_examination_due: findInApiResult(apiResult, 'next_examination', "")
    };
  } catch (e) {
    console.error("Error extracting examination details:", e);
    return {};
  }
}

function extractCertificateDetails(apiResult: any): any {
  try {
    if (apiResult.certificate) {
      return apiResult.certificate;
    }
    
    return {
      issue_date: findInApiResult(apiResult, 'issue_date', ""),
      expiry_date: findInApiResult(apiResult, 'expiry_date', ""),
      fitness_status: findInApiResult(apiResult, 'fitness_status', ""),
      restrictions: findInApiResult(apiResult, 'restrictions', []),
      recommendations: findInApiResult(apiResult, 'recommendations', [])
    };
  } catch (e) {
    console.error("Error extracting certificate details:", e);
    return {};
  }
}

function extractMedicalProfessional(apiResult: any): any {
  try {
    if (apiResult.medical_professional) {
      return apiResult.medical_professional;
    }
    
    if (apiResult.doctor) {
      return apiResult.doctor;
    }
    
    return {
      name: findInApiResult(apiResult, 'doctor_name', ""),
      title: findInApiResult(apiResult, 'doctor_title', ""),
      license_number: findInApiResult(apiResult, 'license_number', ""),
      signature_present: findInApiResult(apiResult, 'signature_present', false)
    };
  } catch (e) {
    console.error("Error extracting medical professional info:", e);
    return {};
  }
}

function extractJobDetails(apiResult: any): any {
  try {
    if (apiResult.job_details) {
      return apiResult.job_details;
    }
    
    return {
      position: findInApiResult(apiResult, 'position', ""),
      department: findInApiResult(apiResult, 'department', ""),
      company: findInApiResult(apiResult, 'company', ""),
      job_requirements: findInApiResult(apiResult, 'job_requirements', [])
    };
  } catch (e) {
    console.error("Error extracting job details:", e);
    return {};
  }
}

// Utility to find values in the API result, looking in various locations
function findInApiResult(apiResult: any, key: string, defaultValue: any): any {
  // Direct match
  if (apiResult[key] !== undefined) {
    return apiResult[key];
  }
  
  // Look for any field containing the key name
  for (const field in apiResult) {
    if (field.toLowerCase().includes(key.toLowerCase()) && 
        typeof apiResult[field] !== 'object') {
      return apiResult[field];
    }
  }
  
  // Look in nested objects, but only one level deep
  for (const field in apiResult) {
    if (typeof apiResult[field] === 'object' && apiResult[field] !== null) {
      if (apiResult[field][key] !== undefined) {
        return apiResult[field][key];
      }
      
      // Also check for partial key matches in nested objects
      for (const nestedField in apiResult[field]) {
        if (nestedField.toLowerCase().includes(key.toLowerCase()) && 
            typeof apiResult[field][nestedField] !== 'object') {
          return apiResult[field][nestedField];
        }
      }
    }
  }
  
  return defaultValue;
}
