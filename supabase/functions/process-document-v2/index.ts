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

// HTML Cleaning Utilities
function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  // Remove HTML comments with coordinates and IDs
  let cleaned = content.replace(/\s*<!--.*?-->\s*/g, ' ');
  
  // Remove HTML tags but preserve their text content
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  
  // Clean up multiple spaces and normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove common HTML artifacts
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  
  return cleaned;
}

function parseHtmlTable(htmlContent: string): string[] {
  if (!htmlContent) return [];
  
  const items: string[] = [];
  
  // Only extract from tables that appear to be in the restrictions section
  // Look for specific table patterns related to restrictions
  const restrictionTablePattern = /<table[^>]*>[\s\S]*?(?:Heights|Dust\s+Exposure|Motorized\s+Equipment|Confined\s+Spaces|Chemical\s+Exposure|Wear\s+Spectacles|Hearing\s+Protection)[\s\S]*?<\/table>/gi;
  
  const restrictionTables = htmlContent.match(restrictionTablePattern) || [];
  
  for (const table of restrictionTables) {
    // Extract content from table cells in restriction tables only
    const tdMatches = table.match(/<td[^>]*>(.*?)<\/td>/gi);
    if (tdMatches) {
      for (const match of tdMatches) {
        const cellContent = match.replace(/<\/?td[^>]*>/gi, '').trim();
        const cleaned = cleanHtmlContent(cellContent);
        
        // Only include if it looks like an actual restriction
        if (cleaned && 
            cleaned !== 'N/A' && 
            cleaned.length > 3 &&
            /(?:spaces|exposure|spectacles|heights|protection|treatment|dust|equipment)/i.test(cleaned)) {
          items.push(cleaned);
        }
      }
    }
    
    // Also try to extract from table headers in restriction context
    const thMatches = table.match(/<th[^>]*>(.*?)<\/th>/gi);
    if (thMatches) {
      for (const match of thMatches) {
        const cellContent = match.replace(/<\/?th[^>]*>/gi, '').trim();
        const cleaned = cleanHtmlContent(cellContent);
        
        // Only include restriction-related headers
        if (cleaned && 
            cleaned !== 'N/A' && 
            cleaned.length > 3 &&
            /(?:restriction|confined|chemical|spectacles|heights|hearing|dust|motorized)/i.test(cleaned)) {
          items.push(cleaned);
        }
      }
    }
  }
  
  return items;
}

function sanitizeExtractedText(text: string): string {
  if (!text) return '';
  
  // Clean HTML content
  let cleaned = cleanHtmlContent(text);
  
  // Remove any remaining HTML artifacts
  cleaned = cleaned.replace(/^<\/?[^>]+>/, ''); // Remove leading HTML tags
  cleaned = cleaned.replace(/<\/?[^>]+>$/, ''); // Remove trailing HTML tags
  
  // Clean up coordinates and IDs that might remain
  cleaned = cleaned.replace(/\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)/g, '');
  cleaned = cleaned.replace(/with ID [a-f0-9\-]+/g, '');
  cleaned = cleaned.replace(/from page \d+/g, '');
  
  // Final cleanup
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

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
        "job_title": {
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
          "enum": ["PRE-EMPLOYMENT", "PERIODICAL", "EXIT"],
          "description": "Type of medical examination from checkboxes - PRE-EMPLOYMENT, PERIODICAL, or EXIT"
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
        },
        "comments": {
          "type": "string",
          "description": "Any comments or additional notes from the medical practitioner"
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
            "result": {"type": "string"}
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
  
  // Post-processing: Clean all extracted data
  cleanExtractedData(extractedData);
  
  console.log("Schema-based extraction completed");
  return extractedData;
}

function cleanExtractedData(data: any): void {
  console.log("=== CLEANING EXTRACTED DATA ===");
  
  function cleanObject(obj: any): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const cleaned = sanitizeExtractedText(value);
        if (cleaned !== value) {
          console.log(`Cleaned ${key}: "${value}" -> "${cleaned}"`);
          obj[key] = cleaned;
        }
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] === 'string') {
            const cleaned = sanitizeExtractedText(value[i]);
            if (cleaned !== value[i]) {
              console.log(`Cleaned array item ${key}[${i}]: "${value[i]}" -> "${cleaned}"`);
              value[i] = cleaned;
            }
          }
        }
        // Remove empty or invalid entries
        obj[key] = value.filter(item => 
          typeof item === 'string' && 
          item.length > 0 && 
          item !== 'N/A' && 
          !item.match(/^<\/?[^>]+>$/) // Remove pure HTML tags
        );
      } else if (typeof value === 'object' && value !== null) {
        cleanObject(value);
      }
    }
  }
  
  cleanObject(data);
  console.log("Data cleaning completed");
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
  
  // Enhanced name extraction with more patterns
  const namePatterns = [
    /Initials\s*&?\s*Surname:\s*([^\n\r]+?)(?:\s+ID\s+NO|$)/i,
    /Employee.*?:\s*([A-Z][A-Z\.\s]+[A-Z])/i,
    /PA\.\s+([A-Z][a-z]+)/i,
    /Name:\s*([A-Z][a-zA-Z\s\.]+)/i,
    /([A-Z]{1,3}\.\s+[A-Z][a-z]+)/i // Pattern like "ET. Mukhola"
  ];
  
  for (const pattern of namePatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      employeeInfo.full_name = sanitizeExtractedText(match[1].trim());
      break;
    }
  }
  
  // Enhanced ID number extraction with more flexible patterns
  const idPatterns = [
    /ID\s*NO[:\s]*([0-9\s]{11,15})/i,
    /ID\s*Number[:\s]*([0-9\s]{11,15})/i,
    /(\d{6}\s*\d{4}\s*\d{3})/i,
    /(\d{13})/i,
    /(\d{2}\d{2}\d{2}\s*\d{4}\s*\d{3})/i // Format like "880303 6591 087"
  ];
  
  for (const pattern of idPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      employeeInfo.id_number = match[1].replace(/\s+/g, '').trim();
      break;
    }
  }
  
  // Enhanced company name extraction
  const companyPatterns = [
    /Company\s*Name:\s*([A-Z][A-Z\s&]+?)(?:\s+Date|Pre-Employment|$)/i,
    /(Wolf\s+Wasser)/i,
    /(APE\s+Pumps?)/i,
    /Company.*?:\s*([A-Z][A-Za-z\s&]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?=\s+Pre-Employment|\s+PRE-)/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      employeeInfo.company_name = sanitizeExtractedText(match[1].trim());
      break;
    }
  }
  
  // Enhanced job title extraction with more specific patterns
  const jobPatterns = [
    /Job\s*Title:\s*([A-Z][A-Za-z\s]+?)(?:\s+PRE-|Date|$)/i,
    /(Artisan)(?=\s|$)/i,
    /Occupation:\s*([A-Z][A-Za-z\s]+)/i,
    /Position:\s*([A-Z][A-Za-z\s]+)/i,
    // Look for job title between company name and examination type
    /Wolf\s+Wasser\s+([A-Z][A-Za-z\s]+?)\s+PRE-EMPLOYMENT/i
  ];
  
  for (const pattern of jobPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 1) {
      const jobTitle = sanitizeExtractedText(match[1].trim());
      // Filter out common false positives
      if (!jobTitle.match(/^(Date|Pre|Employment|Medical|Certificate)$/i)) {
        employeeInfo.job_title = jobTitle;
        break;
      }
    }
  }
  
  return employeeInfo;
}

function extractMedicalExamination(rawContent: string) {
  const examination: any = {};
  
  // Enhanced date extraction with multiple formats and more specific patterns
  const datePatterns = [
    /Date\s*of\s*Examination:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/ig,
    /Examination.*?Date:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/ig,
    // Look for the specific date format in the document (4-10-2024)
    /(\d{1,2}-\d{1,2}-\d{4})(?!\s*\d)/g,
    /(\d{1,2}\/\d{1,2}\/\d{4})(?!\s*\d)/g,
    /(\d{1,2}\.\d{1,2}\.\d{4})(?!\s*\d)/g
  ];
  
  for (const pattern of datePatterns) {
    const matches = rawContent.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        // Validate that this looks like a reasonable examination date
        const dateStr = match[1];
        const dateParts = dateStr.split(/[\.\/\-]/);
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          
          // Basic date validation
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020 && year <= 2030) {
            examination.examination_date = dateStr;
            break;
          }
        }
      }
    }
    if (examination.examination_date) break;
  }
  
  // Updated examination type detection for PRE-EMPLOYMENT/PERIODICAL/EXIT
  const examinationTypePatterns = [
    { type: 'PRE-EMPLOYMENT', patterns: [
      /PRE-?EMPLOYMENT\s*[☒✓x✗]/i,
      /PRE-?EMPLOYMENT\s*\[[x✓]\]/i,
      /PRE-?EMPLOYMENT.*?☒/i,
      /☒\s*PRE-?EMPLOYMENT/i
    ]},
    { type: 'PERIODICAL', patterns: [
      /PERIODICAL\s*[☒✓x✗]/i,
      /PERIODICAL\s*\[[x✓]\]/i,
      /PERIODICAL.*?☒/i,
      /☒\s*PERIODICAL/i
    ]},
    { type: 'EXIT', patterns: [
      /EXIT\s*[☒✓x✗]/i,
      /EXIT\s*\[[x✓]\]/i,
      /EXIT.*?☒/i,
      /☒\s*EXIT/i
    ]}
  ];
  
  for (const examType of examinationTypePatterns) {
    for (const pattern of examType.patterns) {
      if (pattern.test(rawContent)) {
        examination.examination_type = examType.type;
        break;
      }
    }
    if (examination.examination_type) break;
  }
  
  // Enhanced fitness status extraction with multiple patterns
  const fitnessPatterns = [
    { status: 'FIT', patterns: [
      /Medical\s+Fitness\s+Declaration\s*\[x\]\s*FIT/i,
      /\[x\]\s*FIT(?:\s|$)/i,
      /☒\s*FIT(?:\s|$)/i,
      /FIT\s*[☒✓x]/i
    ]},
    { status: 'FIT_WITH_RESTRICTIONS', patterns: [
      /\[x\]\s*Fit\s+with\s+Restriction/i,
      /☒\s*Fit\s+with\s+Restriction/i,
      /Fit\s+with\s+Restriction\s*[☒✓x]/i
    ]},
    { status: 'FIT_WITH_CONDITIONS', patterns: [
      /\[x\]\s*Fit\s+with\s+Condition/i,
      /☒\s*Fit\s+with\s+Condition/i,
      /Fit\s+with\s+Condition\s*[☒✓x]/i
    ]},
    { status: 'TEMPORARILY_UNFIT', patterns: [
      /\[x\]\s*Temporary.*?Unfit/i,
      /☒\s*Temporary.*?Unfit/i,
      /Temporary.*?Unfit\s*[☒✓x]/i
    ]},
    { status: 'UNFIT', patterns: [
      /\[x\]\s*UNFIT/i,
      /☒\s*UNFIT/i,
      /UNFIT\s*[☒✓x]/i
    ]}
  ];
  
  for (const fitness of fitnessPatterns) {
    for (const pattern of fitness.patterns) {
      if (pattern.test(rawContent)) {
        examination.fitness_status = fitness.status;
        break;
      }
    }
    if (examination.fitness_status) break;
  }
  
  // Enhanced expiry date extraction with more patterns
  const expiryPatterns = [
    /Expiry\s*Date:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i,
    /Valid\s*Until:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i,
    /Expires?:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i,
    /Review\s*Date:\s*(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i,
    // Look for dates that appear after examination date
    /Certificate.*?valid.*?(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4})/i
  ];
  
  for (const pattern of expiryPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      examination.expiry_date = match[1];
      break;
    }
  }
  
  // Enhanced comments extraction with better boundaries
  const commentsPatterns = [
    /Comments:\s*([^:]*?)(?:Dr[\s\.]|Occupational|Practice|Signature|$)/is,
    /Additional\s+Notes:\s*([^:]*?)(?:Dr[\s\.]|Occupational|Practice|Signature|$)/is,
    /Remarks:\s*([^:]*?)(?:Dr[\s\.]|Occupational|Practice|Signature|$)/is,
    // Extract any text that appears to be practitioner comments
    /Medical\s+Fitness\s+Declaration.*?Comments:\s*([^:]*?)(?:Dr|Occupational|$)/is
  ];
  
  for (const pattern of commentsPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 0 && match[1].trim() !== 'N/A') {
      let comments = sanitizeExtractedText(match[1].trim());
      // Clean up common artifacts
      comments = comments.replace(/\s*(Dr|Occupational|Practice|Signature).*$/i, '');
      if (comments.length > 5) { // Only keep substantial comments
        examination.comments = comments;
        break;
      }
    }
  }
  
  // Extract restrictions with HTML awareness
  examination.restrictions = extractRestrictions(rawContent);
  
  // Follow-up detection
  examination.follow_up_required = /follow.*?up.*?required/i.test(rawContent) || 
                                   /review.*?required/i.test(rawContent) ||
                                   examination.restrictions.length > 0;
  
  return examination;
}

function extractRestrictions(rawContent: string): string[] {
  const restrictions: string[] = [];
  
  console.log("=== EXTRACTING RESTRICTIONS ===");
  
  // Define actual workplace restrictions patterns - removed duplicate "Hearing Protection"
  const validRestrictions = [
    'Confined Spaces',
    'Chemical Exposure', 
    'Wear Spectacles',
    'Height Work',
    'Heights Work',
    'Working at Heights',
    'Wear Hearing Protection', // Keep only the specific one
    'Chronic Conditions Treatment',
    'Remain on Treatment for Chronic Conditions',
    'Dust Exposure',
    'Motorized Equipment',
    'No Night Work',
    'No Shift Work',
    'Regular Medical Review',
    'Limited Physical Activity',
    'Respiratory Protection Required'
  ];
  
  // First, try to find the specific restrictions section
  const restrictionSectionPatterns = [
    /Restrictions?:\s*([^:]*?)(?:Comments|Medical\s+Fitness\s+Declaration|Dr\s|$)/is,
    /(?:Heights|Dust\s+Exposure|Motorized\s+Equipment|Confined\s+Spaces|Chemical\s+Exposure|Wear\s+Spectacles|Hearing\s+Protection)\s*([^:]*?)(?:Medical\s+Fitness|Comments|Dr\s|$)/is
  ];
  
  // Look for the restrictions section content
  for (const pattern of restrictionSectionPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      const sectionContent = match[1];
      console.log("Found restrictions section:", sectionContent.substring(0, 200));
      
      // Check each valid restriction against the section content
      for (const restriction of validRestrictions) {
        const restrictionPattern = new RegExp(restriction.replace(/\s+/g, '\\s*'), 'i');
        if (restrictionPattern.test(sectionContent)) {
          if (!restrictions.includes(restriction)) {
            restrictions.push(restriction);
            console.log(`✓ Found restriction: ${restriction}`);
          }
        }
      }
      
      // If we found restrictions in this section, don't look further
      if (restrictions.length > 0) {
        break;
      }
    }
  }
  
  // If no restrictions found in specific section, do a careful search in the full content
  if (restrictions.length === 0) {
    console.log("No restrictions found in dedicated section, searching full content carefully...");
    
    for (const restriction of validRestrictions) {
      const restrictionPattern = new RegExp(`\\b${restriction.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (restrictionPattern.test(rawContent)) {
        // Additional validation: make sure it's not part of a medical test result
        const context = rawContent.match(new RegExp(`[^.]*${restriction.replace(/\s+/g, '\\s+')}[^.]*`, 'i'));
        if (context && context[0]) {
          const contextText = context[0].toLowerCase();
          // Skip if it appears to be part of medical test results or headers
          const excludePatterns = [
            'test done results',
            'medical examination conducted',
            'bloods',
            'vision',
            'hearing',
            '20/20',
            'normal',
            'mild restriction',
            'x-ray',
            'drug screen'
          ];
          
          const isExcluded = excludePatterns.some(pattern => contextText.includes(pattern));
          if (!isExcluded && !restrictions.includes(restriction)) {
            restrictions.push(restriction);
            console.log(`✓ Found restriction in full content: ${restriction}`);
          }
        }
      }
    }
  }
  
  // Final validation and cleanup with enhanced deduplication
  const validatedRestrictions = restrictions.filter(restriction => {
    // Make sure it's actually a workplace restriction
    const workplaceRestrictionKeywords = [
      'spaces', 'exposure', 'spectacles', 'heights', 'protection', 
      'treatment', 'dust', 'equipment', 'work', 'activity', 'review'
    ];
    
    return workplaceRestrictionKeywords.some(keyword => 
      restriction.toLowerCase().includes(keyword)
    );
  });
  
  // Enhanced deduplication logic to prevent similar entries
  const deduplicatedRestrictions: string[] = [];
  
  for (const restriction of validatedRestrictions) {
    // Check if a similar restriction already exists
    const isDuplicate = deduplicatedRestrictions.some(existing => {
      const restrictionLower = restriction.toLowerCase();
      const existingLower = existing.toLowerCase();
      
      // Specific case: if we have "Wear Hearing Protection", don't add just "Hearing Protection"
      if (restrictionLower === 'hearing protection' && existingLower === 'wear hearing protection') {
        return true;
      }
      if (restrictionLower === 'wear hearing protection' && existingLower === 'hearing protection') {
        // Replace the less specific one with the more specific one
        const index = deduplicatedRestrictions.findIndex(r => r.toLowerCase() === 'hearing protection');
        if (index !== -1) {
          deduplicatedRestrictions[index] = restriction;
        }
        return true;
      }
      
      // General similarity check for other potential duplicates
      return restrictionLower === existingLower || 
             (restrictionLower.includes(existingLower) && existingLower.length > 5) ||
             (existingLower.includes(restrictionLower) && restrictionLower.length > 5);
    });
    
    if (!isDuplicate) {
      deduplicatedRestrictions.push(restriction);
    }
  }
  
  console.log("Final restrictions:", deduplicatedRestrictions);
  return deduplicatedRestrictions;
}

function extractMedicalTests(rawContent: string) {
  const tests: any = {};
  
  console.log("=== ENHANCED MEDICAL TESTS EXTRACTION ===");
  
  // Enhanced medical test mappings with better result patterns
  const testMappings = [
    {
      key: 'bloods',
      patterns: [
        { name: /BLOODS/i, result: /BLOODS[:\s]*(X|✓|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'vision_test',
      patterns: [
        { name: /FAR,?\s*NEAR\s+VISION/i, result: /FAR,?\s*NEAR\s+VISION[:\s]*(✓|X|20\/\d+|NORMAL|[^\n\r\s]+?)(?:\s|$)/i },
        { name: /VISION/i, result: /VISION[:\s]*(✓|X|20\/\d+|NORMAL|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'side_depth_vision',
      patterns: [
        { name: /SIDE\s*&?\s*DEPTH/i, result: /SIDE\s*&?\s*DEPTH[:\s]*(✓|X|NORMAL|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'night_vision',
      patterns: [
        { name: /NIGHT\s+VISION/i, result: /NIGHT\s+VISION[:\s]*(✓|X|20\/\d+|NORMAL|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'hearing_test', 
      patterns: [
        { name: /HEARING/i, result: /HEARING[:\s]*(✓|X|\d+\.?\d*|NORMAL|MILD\s+RESTRICTION|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'working_heights',
      patterns: [
        { name: /WORKING\s+AT\s+HEIGHTS/i, result: /WORKING\s+AT\s+HEIGHTS[:\s]*(✓|X|FIT|NORMAL|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'lung_function',
      patterns: [
        { name: /LUNG\s+FUNCTION/i, result: /LUNG\s+FUNCTION[:\s]*(✓|X|20\/\d+|NORMAL|[^\n\r\s]+?)(?:\s|$)/i },
        { name: /SPIROMETRY/i, result: /SPIROMETRY[:\s]*(✓|X|NORMAL|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'x_ray',
      patterns: [
        { name: /X-?RAY/i, result: /X-?RAY[:\s]*(✓|X|NORMAL|CLEAR|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    },
    {
      key: 'drug_screen',
      patterns: [
        { name: /DRUG\s+SCREEN/i, result: /DRUG\s+SCREEN[:\s]*(✓|X|NEGATIVE|POSITIVE|[^\n\r\s]+?)(?:\s|$)/i }
      ]
    }
  ];
  
  // Enhanced table parsing for medical tests with better column recognition
  const tablePattern = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const tables = rawContent.match(tablePattern) || [];
  
  let testResultsFromTable: Record<string, { done: boolean, result: string }> = {};
  
  for (const table of tables) {
    // Look for medical tests table (contains test names and results)
    if (/BLOODS|VISION|HEARING|LUNG|X-RAY|DRUG/i.test(table)) {
      console.log("Processing medical tests table...");
      
      // Extract rows from table
      const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      const rows = [...table.matchAll(rowPattern)];
      
      for (const row of rows) {
        const cellPattern = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
        const cells = [...row[1].matchAll(cellPattern)];
        
        if (cells.length >= 2) {
          const testName = cleanHtmlContent(cells[0][1] || '').trim();
          const doneIndicator = cleanHtmlContent(cells[1][1] || '').trim();
          
          // Look for result in subsequent cells if available
          let testResult = 'N/A';
          if (cells.length >= 3) {
            const resultCell = cleanHtmlContent(cells[2][1] || '').trim();
            if (resultCell && resultCell !== 'N/A' && resultCell.length > 0) {
              testResult = resultCell;
            }
          }
          
          if (testName && testName.length > 2) {
            const testKey = getTestKeyFromName(testName);
            if (testKey) {
              const isDone = doneIndicator === '✓' || doneIndicator.toLowerCase().includes('done');
              
              // Clean up the result value
              if (testResult !== 'N/A') {
                testResult = testResult.replace(/^(X\s*|✓\s*)/, '').trim();
                if (testResult === '' || testResult === 'X') {
                  testResult = 'N/A';
                }
              }
              
              testResultsFromTable[testKey] = {
                done: isDone,
                result: testResult
              };
              console.log(`✓ Found table result ${testKey}: Done=${isDone}, Result=${testResult}`);
            }
          }
        }
      }
    }
  }
  
  // Process all test types using enhanced extraction
  for (const testType of testMappings) {
    const testData: any = { performed: false, result: 'N/A' };
    
    // First check if we found this test in the table
    if (testResultsFromTable[testType.key]) {
      const tableData = testResultsFromTable[testType.key];
      testData.performed = tableData.done;
      testData.result = tableData.result;
      console.log(`✓ Using enhanced table result for ${testType.key}: ${JSON.stringify(tableData)}`);
    } else {
      // Fallback to pattern matching with enhanced result extraction
      for (const pattern of testType.patterns) {
        if (pattern.name.test(rawContent)) {
          testData.performed = true;
          
          const resultMatch = rawContent.match(pattern.result);
          if (resultMatch && resultMatch[1]) {
            let result = sanitizeExtractedText(resultMatch[1].trim());
            result = result.replace(/[:\s]+$/, '').trim();
            
            // Enhanced result cleaning and validation
            if (result && result !== '' && result.length > 0) {
              // Clean common prefixes/suffixes
              result = result.replace(/^(X\s*|✓\s*|Done\s*|Result\s*[:]\s*)/i, '').trim();
              
              // Validate result is not just markup
              if (result !== 'N/A' && result !== 'X' && !result.match(/^<\/?[^>]+>$/)) {
                testData.result = result;
                console.log(`✓ Found enhanced pattern result ${testType.key}: ${result}`);
              }
            }
          }
          break;
        }
      }
    }
    
    // Only include core medical tests in the final output
    if (['vision_test', 'hearing_test', 'lung_function', 'x_ray', 'drug_screen', 'bloods', 'side_depth_vision', 'night_vision', 'working_heights'].includes(testType.key)) {
      tests[testType.key] = testData;
    }
  }
  
  console.log("Enhanced medical tests extraction completed");
  return tests;
}

function getTestKeyFromName(testName: string): string | null {
  const testNameLower = testName.toLowerCase();
  
  if (testNameLower.includes('blood')) return 'bloods';
  if (testNameLower.includes('vision') && (testNameLower.includes('far') || testNameLower.includes('near'))) return 'vision_test';
  if (testNameLower.includes('side') && testNameLower.includes('depth')) return 'side_depth_vision';
  if (testNameLower.includes('night') && testNameLower.includes('vision')) return 'night_vision';
  if (testNameLower.includes('hearing')) return 'hearing_test';
  if (testNameLower.includes('height') || testNameLower.includes('working')) return 'working_heights';
  if (testNameLower.includes('lung') || testNameLower.includes('spirometry')) return 'lung_function';
  if (testNameLower.includes('x-ray') || testNameLower.includes('xray')) return 'x_ray';
  if (testNameLower.includes('drug')) return 'drug_screen';
  
  return null;
}

function extractMedicalPractitioner(rawContent: string, chunks: any[]) {
  const practitioner: any = {};
  
  // Enhanced doctor name patterns
  const doctorPatterns = [
    /Dr\.?\s+([A-Z]{1,3}\s+[A-Z][a-z]+)/i, // Pattern like "Dr MJ Mphuthi"
    /Dr\.?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /Doctor:\s*([A-Z][a-zA-Z\s]+)/i,
    /Practitioner:\s*([A-Z][a-zA-Z\s]+)/i,
    /([A-Z]{1,3}\s+[A-Z][a-z]+).*?Occupational/i // Extract name before "Occupational"
  ];
  
  for (const pattern of doctorPatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      practitioner.doctor_name = sanitizeExtractedText(match[1].trim());
      break;
    }
  }
  
  // Enhanced practice number patterns
  const practicePatterns = [
    /Practice\s*No\.?[:\s]*([A-Z0-9]+)/i,
    /MP\s*No\.?[:\s]*([A-Z0-9]+)/i,
    /Registration\s*No\.?[:\s]*([A-Z0-9]+)/i,
    /No[:\s]*([0-9]{7})/i // Pattern like "0404160"
  ];
  
  for (const pattern of practicePatterns) {
    const match = rawContent.match(pattern);
    if (match && match[1]) {
      practitioner.practice_number = match[1].trim();
      break;
    }
  }
  
  // Enhanced signature and stamp detection
  practitioner.signature_present = detectSignature(rawContent, chunks);
  practitioner.stamp_present = detectStamp(rawContent, chunks);
  
  return practitioner;
}

function detectSignature(rawContent: string, chunks: any[]): boolean {
  // Enhanced signature detection keywords
  const signatureKeywords = [
    'signature', 'handwritten', 'stylized flourish', 'overlapping strokes',
    'vertical strokes', 'horizontal line crosses', 'flourish with a loop',
    'signed', 'handwriting', 'pen strokes'
  ];
  
  // Check in chunks first (more reliable)
  for (const chunk of chunks) {
    if (chunk.chunk_type === 'figure' || chunk.type === 'figure') {
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
  // Enhanced stamp detection keywords
  const stampKeywords = [
    'stamp', 'practice no', 'sanc no', 'hpcsa', 'official seal',
    'practice number', 'mp no', 'registration', 'sasohn'
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
  
  // Enhanced key field bonuses
  let keyFieldBonus = 0;
  if (structuredData.employee_info?.full_name) keyFieldBonus += 0.1;
  if (structuredData.employee_info?.id_number) keyFieldBonus += 0.1;
  if (structuredData.medical_examination?.fitness_status) keyFieldBonus += 0.15;
  if (structuredData.medical_examination?.examination_date) keyFieldBonus += 0.1;
  if (structuredData.medical_examination?.examination_type) keyFieldBonus += 0.1;
  if (structuredData.medical_practitioner?.doctor_name) keyFieldBonus += 0.05;
  if (structuredData.medical_practitioner?.signature_present) keyFieldBonus += 0.05;
  
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
    if (!extractedData.medical_examination?.examination_type) {
      errors.push('Missing examination type (PRE-EMPLOYMENT/PERIODICAL/EXIT)');
    }
  }
  
  // Date format validation
  const dateFields = ['examination_date', 'expiry_date'];
  dateFields.forEach(field => {
    const dateValue = extractedData.medical_examination?.[field];
    if (dateValue && !/^\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{4}$/.test(dateValue)) {
      errors.push(`Invalid date format for ${field}: ${dateValue}`);
    }
  });
  
  // Check for remaining HTML content
  const htmlPattern = /<[^>]+>/;
  function checkForHtml(obj: any, path = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof value === 'string' && htmlPattern.test(value)) {
        errors.push(`HTML content detected in ${currentPath}: ${value.substring(0, 50)}...`);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'string' && htmlPattern.test(item)) {
            errors.push(`HTML content detected in ${currentPath}[${index}]: ${item.substring(0, 50)}...`);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        checkForHtml(value, currentPath);
      }
    }
  }
  
  checkForHtml(extractedData);
  
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
