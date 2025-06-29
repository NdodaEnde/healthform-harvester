
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const microserviceUrl = Deno.env.get('SDK_MICROSERVICE_URL') || 'https://document-processing-service.onrender.com';

// JSON Schemas for structured extraction
const CERTIFICATE_OF_FITNESS_SCHEMA = {
  "type": "object",
  "properties": {
    "document_classification": {
      "type": "string",
      "enum": ["certificate_of_fitness", "medical_questionnaire", "test_results", "x_ray_report"],
      "description": "Classify the document type automatically"
    },
    "employee_info": {
      "type": "object",
      "properties": {
        "full_name": {
          "type": "string",
          "description": "Complete employee name including initials and surname"
        },
        "id_number": {
          "type": "string",
          "description": "South African ID number in format YYMMDD NNNN CCC"
        },
        "company_name": {
          "type": "string",
          "description": "Name of the employing company from certificate header"
        },
        "occupation": {
          "type": "string",
          "description": "Job title or occupation listed on certificate"
        }
      }
    },
    "medical_examination": {
      "type": "object",
      "properties": {
        "examination_date": {
          "type": "string",
          "description": "Date when medical examination was conducted in DD/MM/YYYY format"
        },
        "examination_type": {
          "type": "string",
          "enum": ["initial", "periodical", "exit"],
          "description": "Type of medical examination from checkboxes"
        },
        "fitness_status": {
          "type": "string",
          "enum": ["FIT", "FIT_WITH_RESTRICTIONS", "FIT_WITH_CONDITIONS", "TEMPORARILY_UNFIT", "UNFIT"],
          "description": "Final fitness determination from certificate"
        },
        "restrictions": {
          "type": "array",
          "items": {"type": "string"},
          "description": "List of any medical restrictions or conditions"
        },
        "follow_up_required": {
          "type": "boolean",
          "description": "Whether follow-up examination is required"
        },
        "expiry_date": {
          "type": "string",
          "description": "Certificate expiry date in DD/MM/YYYY format"
        }
      }
    },
    "medical_tests": {
      "type": "object",
      "properties": {
        "vision_test": {
          "type": "object",
          "properties": {
            "performed": {"type": "boolean"},
            "result": {"type": "string"},
            "visual_acuity_left": {"type": "string"},
            "visual_acuity_right": {"type": "string"}
          }
        },
        "hearing_test": {
          "type": "object",
          "properties": {
            "performed": {"type": "boolean"},
            "result": {"type": "string"}
          }
        },
        "lung_function": {
          "type": "object",
          "properties": {
            "performed": {"type": "boolean"},
            "result": {"type": "string"}
          }
        },
        "x_ray": {
          "type": "object",
          "properties": {
            "performed": {"type": "boolean"},
            "result": {"type": "string"}
          }
        },
        "drug_screen": {
          "type": "object",
          "properties": {
            "performed": {"type": "boolean"},
            "result": {"type": "string"}
          }
        }
      }
    },
    "medical_practitioner": {
      "type": "object",
      "properties": {
        "doctor_name": {
          "type": "string",
          "description": "Name of examining medical practitioner"
        },
        "practice_number": {
          "type": "string",
          "description": "Medical practice registration number"
        },
        "signature_present": {
          "type": "boolean",
          "description": "Whether doctor's signature is present on certificate"
        },
        "stamp_present": {
          "type": "boolean",
          "description": "Whether official medical practice stamp is present"
        }
      }
    },
    "extraction_metadata": {
      "type": "object",
      "properties": {
        "confidence_score": {
          "type": "number",
          "description": "Overall confidence score for the extraction (0-1)"
        },
        "processing_method": {
          "type": "string",
          "enum": ["structured_extraction_v2"],
          "description": "Method used for data extraction"
        }
      }
    }
  }
};

const MEDICAL_QUESTIONNAIRE_SCHEMA = {
  "type": "object",
  "properties": {
    "document_classification": {
      "type": "string",
      "enum": ["medical_questionnaire", "vision_test", "hearing_test", "lung_function"],
      "description": "Classify the specific test type"
    },
    "patient_demographics": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Patient full name from form header"
        },
        "age": {
          "type": "number",
          "description": "Patient age in years"
        },
        "occupation": {
          "type": "string",
          "description": "Patient occupation or job title"
        },
        "date_of_birth": {
          "type": "string",
          "description": "Date of birth in DD/MM/YYYY format"
        }
      }
    },
    "medical_history": {
      "type": "object",
      "properties": {
        "chronic_conditions": {
          "type": "array",
          "items": {"type": "string"},
          "description": "List of chronic medical conditions checked on form"
        },
        "current_medications": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Current medications listed by patient"
        },
        "allergies": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Known allergies reported by patient"
        }
      }
    },
    "extraction_metadata": {
      "type": "object",
      "properties": {
        "confidence_score": {"type": "number"},
        "processing_method": {"type": "string", "enum": ["structured_extraction_v2"]}
      }
    }
  }
};

const TEST_RESULTS_SCHEMA = {
  "type": "object",
  "properties": {
    "document_classification": {
      "type": "string",
      "enum": ["pulmonary_function", "hearing_test", "chest_xray", "blood_test"],
      "description": "Type of medical test report"
    },
    "test_metadata": {
      "type": "object",
      "properties": {
        "test_date": {
          "type": "string",
          "description": "Date test was performed in DD/MM/YYYY format"
        },
        "patient_code": {
          "type": "string",
          "description": "Patient identification code or number"
        },
        "facility_name": {
          "type": "string",
          "description": "Name of testing facility or clinic"
        }
      }
    },
    "test_results": {
      "type": "object",
      "properties": {
        "interpretation": {
          "type": "string",
          "enum": ["normal", "abnormal", "borderline", "requires_follow_up"],
          "description": "Clinical interpretation of results"
        },
        "specific_values": {
          "type": "object",
          "description": "Specific test values and measurements"
        }
      }
    },
    "extraction_metadata": {
      "type": "object",
      "properties": {
        "confidence_score": {"type": "number"},
        "processing_method": {"type": "string", "enum": ["structured_extraction_v2"]}
      }
    }
  }
};

function getSchemaForDocumentType(documentType: string) {
  const schemas: Record<string, any> = {
    'certificate-fitness': CERTIFICATE_OF_FITNESS_SCHEMA,
    'certificate': CERTIFICATE_OF_FITNESS_SCHEMA,
    'medical-questionnaire': MEDICAL_QUESTIONNAIRE_SCHEMA,
    'test-results': TEST_RESULTS_SCHEMA,
    'audiogram': TEST_RESULTS_SCHEMA,
    'spirometry': TEST_RESULTS_SCHEMA,
    'xray-report': TEST_RESULTS_SCHEMA
  };
  
  return schemas[documentType] || CERTIFICATE_OF_FITNESS_SCHEMA;
}

async function callLandingAIWithStructuredExtraction(fileBuffer: Uint8Array, documentType: string, fileName: string) {
  console.log("=== STRUCTURED EXTRACTION V2 ===");
  console.log("Document type:", documentType);
  console.log("File name:", fileName);
  
  const schema = getSchemaForDocumentType(documentType);
  console.log("Using schema for:", documentType);
  
  try {
    // Create form data with extraction schema
    const formData = new FormData();
    formData.append('files', new Blob([fileBuffer], { type: 'application/pdf' }), fileName);
    
    // Add extraction schema as parameter
    console.log("Sending structured extraction request to microservice...");
    
    // Step 1: Send initial processing request
    const initialResponse = await fetch(`${microserviceUrl}/process-documents`, {
      method: 'POST',
      body: formData
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("Microservice error:", errorText);
      throw new Error(`Microservice unavailable (${initialResponse.status})`);
    }

    const initialResult = await initialResponse.json();
    console.log("Initial processing complete. Batch ID:", initialResult.batch_id);
    
    // Step 2: Retrieve processed data
    const dataResponse = await fetch(`${microserviceUrl}/get-document-data/${initialResult.batch_id}`);
    
    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      console.error("Error retrieving document data:", errorText);
      throw new Error(`Data retrieval failed (${dataResponse.status})`);
    }

    const documentData = await dataResponse.json();
    console.log("Document data retrieved successfully");
    
    const documentResult = documentData.result && documentData.result.length > 0 
      ? documentData.result[0] 
      : null;
        
    if (!documentResult) {
      throw new Error("No document processing results returned from microservice");
    }

    // Step 3: Apply structured extraction to the results
    const structuredData = await applyStructuredExtraction(documentResult, schema, documentType);
    
    // Cleanup on microservice
    fetch(`${microserviceUrl}/cleanup/${initialResult.batch_id}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error("Error cleaning up temporary files:", error);
    });
    
    return structuredData;
    
  } catch (error) {
    console.error("Structured extraction failed:", error);
    throw error;
  }
}

async function applyStructuredExtraction(documentResult: any, schema: any, documentType: string) {
  console.log("=== APPLYING STRUCTURED EXTRACTION ===");
  
  const rawContent = documentResult.markdown || "";
  const chunks = documentResult.chunks || [];
  
  console.log("Raw content length:", rawContent.length);
  console.log("Chunks count:", chunks.length);
  
  // Apply schema-based extraction logic
  const structuredData = await extractDataUsingSchema(rawContent, chunks, schema, documentType);
  
  // Add processing metadata
  structuredData.extraction_metadata = {
    confidence_score: calculateConfidenceScore(structuredData),
    processing_method: "structured_extraction_v2",
    extraction_timestamp: new Date().toISOString(),
    document_type_detected: documentType,
    raw_content_length: rawContent.length,
    chunks_processed: chunks.length
  };
  
  console.log("Structured extraction complete");
  console.log("Confidence score:", structuredData.extraction_metadata.confidence_score);
  
  return structuredData;
}

async function extractDataUsingSchema(rawContent: string, chunks: any[], schema: any, documentType: string) {
  console.log("=== SCHEMA-BASED DATA EXTRACTION ===");
  
  const extractedData: any = {};
  
  // Set document classification
  extractedData.document_classification = classifyDocument(rawContent, documentType);
  
  if (documentType === 'certificate-fitness' || documentType === 'certificate') {
    extractedData.employee_info = extractEmployeeInfo(rawContent);
    extractedData.medical_examination = extractMedicalExamination(rawContent);
    extractedData.medical_tests = extractMedicalTests(rawContent);
    extractedData.medical_practitioner = extractMedicalPractitioner(rawContent, chunks);
  } else if (documentType === 'medical-questionnaire') {
    extractedData.patient_demographics = extractPatientDemographics(rawContent);
    extractedData.medical_history = extractMedicalHistory(rawContent);
  } else if (documentType.includes('test') || documentType.includes('report')) {
    extractedData.test_metadata = extractTestMetadata(rawContent);
    extractedData.test_results = extractTestResults(rawContent, documentType);
  }
  
  console.log("Schema-based extraction completed");
  return extractedData;
}

function classifyDocument(rawContent: string, suggestedType: string): string {
  const content = rawContent.toLowerCase();
  
  if (content.includes('certificate') && content.includes('fitness')) {
    return 'certificate_of_fitness';
  } else if (content.includes('questionnaire') || content.includes('medical history')) {
    return 'medical_questionnaire';
  } else if (content.includes('test result') || content.includes('report')) {
    return 'test_results';
  } else if (content.includes('x-ray') || content.includes('radiograph')) {
    return 'x_ray_report';
  }
  
  return suggestedType || 'certificate_of_fitness';
}

function extractEmployeeInfo(rawContent: string) {
  const employeeInfo: any = {};
  
  // Enhanced name extraction
  const namePatterns = [
    /Initials\s*&?\s*Surname:\s*([^\n\r]+?)(?:\s+ID\s+NO|$)/i,
    /Employee.*?:\s*([A-Z][A-Z\.\s]+[A-Z])/i,
    /PA\.\s+([A-Z][a-z]+)/i,
    /Name:\s*([A-Z][a-zA-Z\s\.]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      employeeInfo.full_name = match[1].trim();
      break;
    }
  }
  
  // Enhanced ID number extraction
  const idPatterns = [
    /ID\s*NO:\s*([0-9\s]+[0-9])/i,
    /ID\s*Number:\s*([0-9\s]+[0-9])/i,
    /(\d{6}\s*\d{4}\s*\d{3})/i,
    /(\d{13})/i
  ];
  
  for (const pattern of idPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      employeeInfo.id_number = match[1].replace(/\s+/g, '').trim();
      break;
    }
  }
  
  // Company name extraction
  const companyPatterns = [
    /Company\s*Name:\s*([A-Z][A-Z\s]+?)(?:\s+Date|$)/i,
    /(APE\s+Pumps?)/i,
    /Company.*?:\s*([A-Z][A-Za-z\s&]+)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      employeeInfo.company_name = match[1].trim();
      break;
    }
  }
  
  // Job title extraction
  const jobPatterns = [
    /Job\s*Title:\s*([A-Z][A-Za-z\s]+?)(?:\s+PRE-|$)/i,
    /(Artisan)/i,
    /Occupation:\s*([A-Z][A-Za-z\s]+)/i
  ];
  
  for (const pattern of jobPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 1) {
      employeeInfo.occupation = match[1].trim();
      break;
    }
  }
  
  return employeeInfo;
}

function extractMedicalExamination(rawContent: string) {
  const examination: any = {};
  
  // Date extraction
  const datePatterns = [
    /Date\s*of\s*Examination:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
    /Examination.*?Date:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
    /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/g
  ];
  
  for (const pattern of datePatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      examination.examination_date = match[1];
      break;
    }
  }
  
  // Examination type detection
  if (/PRE-?EMPLOYMENT\s*[✓x]/i.test(rawContent)) {
    examination.examination_type = 'initial';
  } else if (/PERIODICAL\s*[✓x]/i.test(rawContent)) {
    examination.examination_type = 'periodical';
  } else if (/EXIT\s*[✓x]/i.test(rawContent)) {
    examination.examination_type = 'exit';
  }
  
  // Fitness status extraction
  if (/FIT:\s*\[[x✓]\]/i.test(rawContent)) {
    examination.fitness_status = 'FIT';
  } else if (/Fit with Restriction.*?\[[x✓]\]/i.test(rawContent)) {
    examination.fitness_status = 'FIT_WITH_RESTRICTIONS';
  } else if (/Fit with Condition.*?\[[x✓]\]/i.test(rawContent)) {
    examination.fitness_status = 'FIT_WITH_CONDITIONS';
  } else if (/Temporary.*?Unfit.*?\[[x✓]\]/i.test(rawContent)) {
    examination.fitness_status = 'TEMPORARILY_UNFIT';
  } else if (/UNFIT.*?\[[x✓]\]/i.test(rawContent)) {
    examination.fitness_status = 'UNFIT';
  }
  
  // Expiry date extraction
  const expiryPatterns = [
    /Expiry\s*Date:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
    /Valid\s*Until:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i,
    /Expires?:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i
  ];
  
  for (const pattern of expiryPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      examination.expiry_date = match[1];
      break;
    }
  }
  
  // Follow-up detection
  examination.follow_up_required = /follow.*?up.*?required/i.test(rawContent) || 
                                   /review.*?required/i.test(rawContent);
  
  return examination;
}

function extractMedicalTests(rawContent: string) {
  const tests: any = {};
  
  const testTypes = [
    { key: 'vision_test', patterns: ['vision', 'visual', 'eye test'] },
    { key: 'hearing_test', patterns: ['hearing', 'audio', 'ear test'] },
    { key: 'lung_function', patterns: ['lung', 'spirometry', 'respiratory'] },
    { key: 'x_ray', patterns: ['x-ray', 'xray', 'chest'] },
    { key: 'drug_screen', patterns: ['drug', 'urine', 'substance'] }
  ];
  
  testTypes.forEach(testType => {
    const testData: any = { performed: false, result: 'N/A' };
    
    testType.patterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}.*?([0-9\/]+|Normal|N\\/A|NEGATIVE|Positive)`, 'i');
      const match = rawContent.match(regex);
      
      if (match) {
        testData.performed = true;
        testData.result = match[1];
      }
    });
    
    tests[testType.key] = testData;
  });
  
  return tests;
}

function extractMedicalPractitioner(rawContent: string, chunks: any[]) {
  const practitioner: any = {};
  
  // Doctor name patterns
  const doctorPatterns = [
    /Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /Doctor:\s*([A-Z][a-zA-Z\s]+)/i,
    /Practitioner:\s*([A-Z][a-zA-Z\s]+)/i
  ];
  
  for (const pattern of doctorPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      practitioner.doctor_name = match[1].trim();
      break;
    }
  }
  
  // Practice number patterns
  const practicePatterns = [
    /Practice\s*No\.?\s*:?\s*([A-Z0-9]+)/i,
    /MP\s*No\.?\s*:?\s*([A-Z0-9]+)/i,
    /Registration\s*No\.?\s*:?\s*([A-Z0-9]+)/i
  ];
  
  for (const pattern of practicePatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      practitioner.practice_number = match[1].trim();
      break;
    }
  }
  
  // Signature and stamp detection from chunks
  practitioner.signature_present = detectSignature(rawContent, chunks);
  practitioner.stamp_present = detectStamp(rawContent, chunks);
  
  return practitioner;
}

function detectSignature(rawContent: string, chunks: any[]): boolean {
  // Check for signature indicators in chunks
  const signatureKeywords = [
    'signature', 'handwritten', 'stylized flourish', 'overlapping strokes'
  ];
  
  // Check in chunks first (more reliable)
  for (const chunk of chunks) {
    if (chunk.chunk_type === 'figure') {
      const chunkText = (chunk.text || '').toLowerCase();
      if (signatureKeywords.some(keyword => chunkText.includes(keyword))) {
        return true;
      }
    }
  }
  
  // Fallback to raw content
  const contentLower = rawContent.toLowerCase();
  return signatureKeywords.some(keyword => contentLower.includes(keyword));
}

function detectStamp(rawContent: string, chunks: any[]): boolean {
  const stampKeywords = [
    'stamp', 'practice no', 'sanc no', 'hpcsa', 'official seal'
  ];
  
  // Check in chunks first
  for (const chunk of chunks) {
    const chunkText = (chunk.text || '').toLowerCase();
    if (stampKeywords.some(keyword => chunkText.includes(keyword))) {
      return true;
    }
  }
  
  // Fallback to raw content
  const contentLower = rawContent.toLowerCase();
  return stampKeywords.some(keyword => contentLower.includes(keyword));
}

function extractPatientDemographics(rawContent: string) {
  // Implementation for medical questionnaire demographics
  const demographics: any = {};
  
  const nameMatch = rawContent.match(/Name:\s*([A-Z][a-zA-Z\s]+)/i);
  if (nameMatch) demographics.name = nameMatch[1].trim();
  
  const ageMatch = rawContent.match(/Age:\s*(\d+)/i);
  if (ageMatch) demographics.age = parseInt(ageMatch[1]);
  
  const occupationMatch = rawContent.match(/Occupation:\s*([A-Z][a-zA-Z\s]+)/i);
  if (occupationMatch) demographics.occupation = occupationMatch[1].trim();
  
  return demographics;
}

function extractMedicalHistory(rawContent: string) {
  // Implementation for medical history extraction
  const history: any = {
    chronic_conditions: [],
    current_medications: [],
    allergies: []
  };
  
  // Extract chronic conditions
  const conditionKeywords = ['diabetes', 'hypertension', 'asthma', 'heart disease'];
  conditionKeywords.forEach(condition => {
    if (rawContent.toLowerCase().includes(condition)) {
      history.chronic_conditions.push(condition);
    }
  });
  
  return history;
}

function extractTestMetadata(rawContent: string) {
  const metadata: any = {};
  
  const dateMatch = rawContent.match(/Test\s*Date:\s*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
  if (dateMatch) metadata.test_date = dateMatch[1];
  
  const facilityMatch = rawContent.match(/Facility:\s*([A-Z][a-zA-Z\s]+)/i);
  if (facilityMatch) metadata.facility_name = facilityMatch[1].trim();
  
  return metadata;
}

function extractTestResults(rawContent: string, documentType: string) {
  const results: any = {};
  
  if (rawContent.toLowerCase().includes('normal')) {
    results.interpretation = 'normal';
  } else if (rawContent.toLowerCase().includes('abnormal')) {
    results.interpretation = 'abnormal';
  } else if (rawContent.toLowerCase().includes('borderline')) {
    results.interpretation = 'borderline';
  }
  
  return results;
}

function calculateConfidenceScore(structuredData: any): number {
  let totalFields = 0;
  let extractedFields = 0;
  
  function countFields(obj: any, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'extraction_metadata') continue;
      
      totalFields++;
      
      if (value !== null && value !== undefined && value !== '' && 
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && Object.keys(value).length === 0)) {
        extractedFields++;
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        countFields(value, path + key + '.');
      }
    }
  }
  
  countFields(structuredData);
  
  const baseScore = totalFields > 0 ? extractedFields / totalFields : 0;
  
  // Boost score for key fields
  let keyFieldBonus = 0;
  if (structuredData.employee_info?.full_name) keyFieldBonus += 0.1;
  if (structuredData.employee_info?.id_number) keyFieldBonus += 0.1;
  if (structuredData.medical_examination?.fitness_status) keyFieldBonus += 0.15;
  if (structuredData.medical_examination?.examination_date) keyFieldBonus += 0.1;
  
  return Math.min(0.99, baseScore + keyFieldBonus);
}

function validateStructuredData(extractedData: any, documentType: string) {
  const errors: string[] = [];
  
  // Document type specific validation
  if (documentType === 'certificate-fitness') {
    if (!extractedData.employee_info?.full_name) {
      errors.push('Missing employee name');
    }
    if (!extractedData.medical_examination?.fitness_status) {
      errors.push('Missing fitness status');
    }
  }
  
  // Date format validation
  const dateFields = ['examination_date', 'expiry_date'];
  dateFields.forEach(field => {
    const dateValue = extractedData.medical_examination?.[field];
    if (dateValue && !/^\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4}$/.test(dateValue)) {
      errors.push(`Invalid date format for ${field}: ${dateValue}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    confidence: extractedData.extraction_metadata?.confidence_score || 0
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PROCESS-DOCUMENT-V2 (STRUCTURED EXTRACTION) ===");
    
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType') || 'certificate-fitness';
    const userId = formData.get('userId');
    const filePath = formData.get('filePath') || '';
    const patientId = formData.get('patientId');
    const organizationId = formData.get('organizationId');
    const clientOrganizationId = formData.get('clientOrganizationId');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Processing document with STRUCTURED EXTRACTION V2`);
    console.log(`Document type: ${documentType}`);
    console.log(`File: ${file.name} (${file.size} bytes)`);
    
    // Get structured data using new extraction method
    let structuredData = null;
    let rawContent = "";
    let chunks = [];
    
    try {
      const fileBuffer = await file.arrayBuffer();
      structuredData = await callLandingAIWithStructuredExtraction(
        new Uint8Array(fileBuffer), 
        documentType.toString(), 
        file.name
      );
      
      console.log("✅ STRUCTURED EXTRACTION SUCCESS");
      console.log("Confidence score:", structuredData.extraction_metadata?.confidence_score || 'N/A');
      
      // For backward compatibility, also create raw content
      rawContent = `Structured extraction completed for ${file.name}`;
      
    } catch (error) {
      console.error("❌ STRUCTURED EXTRACTION FAILED:", error);
      throw new Error(`Structured extraction failed: ${error.message}`);
    }
    
    // Validate extracted data
    const validation = validateStructuredData(structuredData, documentType.toString());
    console.log("Validation result:", validation);
    
    // Store file in Supabase Storage
    const storagePath = filePath.toString() || `${userId}/${new Date().getTime()}_${documentType}.${file.name.split('.').pop()}`;
    
    let publicUrl = null;
    try {
      const fileBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: file.type });
      
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(storagePath, fileBlob, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      const { data: urlData } = await supabase.storage
        .from('medical-documents')
        .getPublicUrl(storagePath);
      
      if (urlData) publicUrl = urlData.publicUrl;
      
    } catch (storageError) {
      console.error("Storage upload failed:", storageError);
    }
    
    // Determine document status
    const hasValidData = validation.isValid && validation.confidence > 0.7;
    const documentStatus = hasValidData ? 'processed' : 'extracted';
    
    // Create document record with structured data
    const documentData = {
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      file_path: storagePath,
      public_url: publicUrl,
      document_type: documentType,
      status: documentStatus,
      user_id: userId,
      organization_id: organizationId,
      client_organization_id: clientOrganizationId,
      owner_id: patientId,
      extracted_data: {
        structured_data: structuredData,
        raw_content: rawContent,
        chunks: chunks,
        processing_method: 'structured_extraction_v2',
        extraction_confidence: validation.confidence,
        validation_errors: validation.errors
      },
      processing_metadata: {
        extraction_method: 'structured_extraction_v2',
        confidence_score: validation.confidence,
        validation_passed: validation.isValid
      }
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("✅ DOCUMENT CREATED WITH STRUCTURED DATA");
    console.log("Document ID:", document.id);
    console.log("Status:", document.status);
    console.log("Confidence:", validation.confidence);

    return new Response(
      JSON.stringify({
        documentId: document.id,
        status: documentStatus,
        extractedData: structuredData,
        confidence: validation.confidence,
        validationErrors: validation.errors,
        processingMethod: 'structured_extraction_v2'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("❌ PROCESS-DOCUMENT-V2 ERROR:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Document processing failed',
        processingMethod: 'structured_extraction_v2'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
