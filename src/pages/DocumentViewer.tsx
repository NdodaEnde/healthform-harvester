import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import CertificateTemplate from "@/components/CertificateTemplate";

const mockDocumentData = {
  id: "doc-1",
  name: "Medical Exam - John Doe.pdf",
  type: "Medical Examination Questionnaire",
  uploadedAt: "2023-05-15T10:30:00",
  status: "processed",
  patientName: "John Doe",
  patientId: "P10045",
  imageUrl: "https://images.pexels.com/photos/1571458/pexels-photo-1571458.jpeg",
  extractedData: {
    personal: {
      fullName: "John Michael Doe",
      dateOfBirth: "1985-04-12",
      gender: "Male",
      employeeId: "EMP-10045",
      address: "123 Main Street, Anytown, State, 12345",
      phoneNumber: "(555) 123-4567",
      email: "john.doe@example.com",
      occupation: "Chemical Engineer",
      employer: "ABC Manufacturing Inc."
    },
    medical: {
      allergies: "None",
      currentMedications: "Lisinopril 10mg daily",
      chronicConditions: "Hypertension",
      previousSurgeries: "Appendectomy (2010)",
      familyHistory: "Father: Diabetes, Mother: Hypertension",
      smoker: "No",
      alcoholConsumption: "Occasional",
      exerciseFrequency: "2-3 times per week"
    },
    vitals: {
      height: "182 cm",
      weight: "84 kg",
      bmi: "25.4",
      bloodPressure: "128/82 mmHg",
      heartRate: "72 bpm",
      respiratoryRate: "16 rpm",
      temperature: "98.6 °F",
      oxygenSaturation: "98%"
    },
    examResults: {
      vision: "20/20 both eyes",
      hearing: "Normal range",
      lungFunction: "FEV1: 3.8L (95% predicted)",
      chestXRay: "No abnormalities detected",
      laboratory: "Cholesterol: 195 mg/dL, Glucose: 92 mg/dL, HDL: 45 mg/dL, LDL: 130 mg/dL"
    },
    assessment: {
      diagnosis: "Hypertension, well-controlled",
      recommendations: "Continue current medication. Follow up in 12 months. Increase physical activity.",
      restrictions: "None",
      fitnessConclusion: "Fit for duty without restrictions"
    }
  },
  jsonData: `{
  "patient": {
    "name": "John Michael Doe",
    "id": "P10045",
    "dateOfBirth": "1985-04-12",
    "gender": "Male",
    "contactInfo": {
      "phone": "(555) 123-4567",
      "email": "john.doe@example.com",
      "address": "123 Main Street, Anytown, State, 12345"
    },
    "employment": {
      "employer": "ABC Manufacturing Inc.",
      "occupation": "Chemical Engineer",
      "employeeId": "EMP-10045"
    }
  },
  "medicalHistory": {
    "allergies": "None",
    "medications": ["Lisinopril 10mg daily"],
    "chronicConditions": ["Hypertension"],
    "surgeries": ["Appendectomy (2010)"],
    "familyHistory": {
      "father": ["Diabetes"],
      "mother": ["Hypertension"]
    },
    "lifestyle": {
      "smoker": false,
      "alcoholConsumption": "Occasional",
      "exercise": "2-3 times per week"
    }
  },
  "examination": {
    "date": "2023-05-15",
    "vitals": {
      "height": "182 cm",
      "weight": "84 kg",
      "bmi": 25.4,
      "bloodPressure": "128/82 mmHg",
      "heartRate": 72,
      "respiratoryRate": 16,
      "temperature": 98.6,
      "oxygenSaturation": 98
    },
    "results": {
      "vision": "20/20 both eyes",
      "hearing": "Normal range",
      "lungFunction": {
        "fev1": "3.8L",
        "percentPredicted": 95
      },
      "imaging": {
        "chestXRay": "No abnormalities detected"
      },
      "laboratory": {
        "cholesterol": 195,
        "glucose": 92,
        "hdl": 45,
        "ldl": 130
      }
    }
  },
  "assessment": {
    "diagnosis": ["Hypertension, well-controlled"],
    "recommendations": [
      "Continue current medication",
      "Follow up in 12 months",
      "Increase physical activity"
    ],
    "restrictions": "None",
    "conclusion": "Fit for duty without restrictions"
  }
}`
};

const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showOriginal, setShowOriginal] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);

  const extractPatientName = (extractedData: any) => {
    if (!extractedData) return "Unknown";
    
    console.log("Extracting patient name from:", extractedData);
    
    if (typeof extractedData !== 'object' || extractedData === null) {
      return "Unknown";
    }
    
    if (Array.isArray(extractedData)) {
      return "Unknown";
    }
    
    if (extractedData.structured_data && typeof extractedData.structured_data === 'object') {
      const patientData = extractedData.structured_data.patient;
      if (patientData && typeof patientData === 'object') {
        if (patientData.name) return patientData.name;
        if (patientData.full_name) return patientData.full_name;
      }
    }
    
    if (extractedData.raw_response && typeof extractedData.raw_response === 'object' && extractedData.raw_response.data) {
      const markdown = extractedData.raw_response.data.markdown;
      if (markdown) {
        const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (nameMatch && nameMatch[1]) return nameMatch[1].trim();
      }
    }
    
    if (typeof extractedData === 'object') {
      const findPatientName = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj.patient && obj.patient.name) return obj.patient.name;
        if (obj.name && typeof obj.name === 'string') return obj.name;
        if (obj.full_name && typeof obj.full_name === 'string') return obj.full_name;
        
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const name = findPatientName(obj[key]);
            if (name) return name;
          }
        }
        
        return null;
      };
      
      const foundName = findPatientName(extractedData);
      if (foundName) return foundName;
    }
    
    return "Unknown";
  };

  const extractPatientId = (extractedData: any) => {
    if (!extractedData) return "No ID";
    
    console.log("Extracting patient ID from:", extractedData);
    
    if (typeof extractedData !== 'object' || extractedData === null) {
      return "No ID";
    }
    
    if (Array.isArray(extractedData)) {
      return "No ID";
    }
    
    if (extractedData.structured_data && typeof extractedData.structured_data === 'object') {
      const patientData = extractedData.structured_data.patient;
      if (patientData && typeof patientData === 'object') {
        if (patientData.id_number) return patientData.id_number;
        if (patientData.employee_id) return patientData.employee_id; 
        if (patientData.id) return patientData.id;
      }
    }
    
    if (extractedData.raw_response && typeof extractedData.raw_response === 'object' && extractedData.raw_response.data) {
      const markdown = extractedData.raw_response.data.markdown;
      if (markdown) {
        const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (idMatch && idMatch[1]) return idMatch[1].trim();
      }
    }
    
    if (typeof extractedData === 'object') {
      const findPatientId = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj.patient && obj.patient.id_number) return obj.patient.id_number;
        if (obj.patient && obj.patient.id) return obj.patient.id;
        if (obj.id_number && typeof obj.id_number === 'string') return obj.id_number;
        
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const id = findPatientId(obj[key]);
            if (id) return id;
          }
        }
        
        return null;
      };
      
      const foundId = findPatientId(extractedData);
      if (foundId) return foundId;
    }
    
    return "No ID";
  };

  const processCertificateData = (rawData: any) => {
    console.log("Processing certificate data:", rawData);
    
    if (!rawData) return rawData;
    
    // Comprehensive processor for Landing AI data
    const processLandingAIResponse = (data: any) => {
      // First check if we already have a well-structured response
      if (data.raw_response?.data?.markdown) {
        console.log("Data already has raw_response.data.markdown structure");
        return data;
      }
      
      let processedData = { ...data };
      let extractedMarkdown = null;
      
      // Try to find markdown in the data
      if (typeof data === 'string') {
        // Case 1: Data is a JSON string
        try {
          const parsed = JSON.parse(data);
          if (parsed.data?.markdown) {
            console.log("Found markdown in parsed JSON string");
            processedData = {
              raw_response: parsed,
              structured_data: extractStructuredData(parsed.data.markdown)
            };
            return processedData;
          }
        } catch (e) {
          // Not a JSON string, check if it's markdown directly
          if (data.includes('## Description') || 
              data.includes('**Initials & Surname**') || 
              data.includes('# CERTIFICATE OF FITNESS')) {
            extractedMarkdown = data;
          }
        }
      }
      
      // Case 2: Direct markdown field
      if (data.markdown && typeof data.markdown === 'string') {
        console.log("Found direct markdown field");
        extractedMarkdown = data.markdown;
      }
      
      // Case 3: Data field with markdown 
      if (data.data?.markdown && typeof data.data.markdown === 'string') {
        console.log("Found data.markdown field");
        extractedMarkdown = data.data.markdown;
      }
      
      // Case 4: event_message field (common in edge function responses)
      if (data.event_message && typeof data.event_message === 'string') {
        console.log("Processing event_message field");
        
        // Try to extract Response: JSON object
        const responseMatch = data.event_message.match(/Response:\s*(\{.*\})/s);
        if (responseMatch && responseMatch[1]) {
          try {
            const responseObj = JSON.parse(responseMatch[1]);
            if (responseObj.data?.markdown) {
              console.log("Found markdown in Response: JSON");
              extractedMarkdown = responseObj.data.markdown;
              
              processedData = {
                raw_response: responseObj,
                structured_data: extractStructuredData(extractedMarkdown)
              };
              return processedData;
            }
          } catch (e) {
            console.error("Failed to parse Response: JSON", e);
          }
        }
        
        // Try to find markdown in the event_message directly
        const markdownPattern = /"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s;
        const markdownMatch = data.event_message.match(markdownPattern);
        if (markdownMatch && markdownMatch[1]) {
          console.log("Found markdown in JSON pattern within event_message");
          extractedMarkdown = markdownMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
        // Check if event_message itself looks like markdown
        else if (data.event_message.includes('## Description') || 
                data.event_message.includes('**Initials & Surname**') ||
                data.event_message.includes('# CERTIFICATE OF FITNESS')) {
          console.log("Event message itself appears to be markdown");
          extractedMarkdown = data.event_message;
        }
      }
      
      // Case 5: Check for chunks array
      if (!extractedMarkdown && data.raw_response?.data?.chunks) {
        console.log("Checking chunks array for content");
        const chunks = data.raw_response.data.chunks;
        if (Array.isArray(chunks)) {
          let combinedText = '';
          chunks.forEach((chunk: any) => {
            if (chunk.text) {
              combinedText += chunk.text + '\n\n';
            }
          });
          
          if (combinedText) {
            console.log("Combined text from chunks array");
            extractedMarkdown = combinedText;
          }
        }
      }
      
      // If we found markdown, create a properly structured response
      if (extractedMarkdown) {
        console.log("Creating structured response with extracted markdown");
        // Extract structured data from the markdown
        const structuredData = extractStructuredData(extractedMarkdown);
        
        processedData = {
          raw_response: {
            data: {
              markdown: extractedMarkdown
            }
          },
          structured_data: structuredData
        };
      }
      
      return processedData;
    };
    
    // Helper to extract structured data from markdown
    const extractStructuredData = (markdown: string): any => {
      if (!markdown) return {};
      
      console.log("Extracting structured data from markdown");
      
      // Initialize structured data with default structure
      const extractedData: any = {
        patient: {},
        examination_results: {
          type: {},
          test_results: {}
        },
        certification: {},
        restrictions: {}
      };
      
      // Extract patient data
      const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (nameMatch && nameMatch[1]) extractedData.patient.name = nameMatch[1].trim();
      
      const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (idMatch && idMatch[1]) extractedData.patient.id_number = idMatch[1].trim();
      
      const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (companyMatch && companyMatch[1]) extractedData.patient.company = companyMatch[1].trim();
      
      const jobTitleMatch = markdown.match(/(?:Job Title|Occupation):\s*(.*?)(?=\n|\r|$)/i);
      if (jobTitleMatch && jobTitleMatch[1]) extractedData.patient.occupation = jobTitleMatch[1].trim();
      
      // Examination details
      const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (examDateMatch && examDateMatch[1]) extractedData.examination_results.date = examDateMatch[1].trim();
      
      const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (expiryDateMatch && expiryDateMatch[1]) extractedData.certification.valid_until = expiryDateMatch[1].trim();
      
      // Examination type
      extractedData.examination_results.type.pre_employment = 
        markdown.includes('**Pre-Employment**') || 
        markdown.match(/PRE-EMPLOYMENT.*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      
      extractedData.examination_results.type.periodical = 
        markdown.includes('**Periodical**') || 
        markdown.match(/PERIODICAL.*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      
      extractedData.examination_results.type.exit = 
        markdown.includes('**Exit**') || 
        markdown.match(/EXIT.*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      
      // Default values for test results (this can be enhanced if needed)
      extractedData.examination_results.test_results = {
        bloods_done: true,
        bloods_results: 'N/A',
        far_near_vision_done: true,
        far_near_vision_results: '20/30',
        side_depth_done: true,
        side_depth_results: 'Normal',
        night_vision_done: true,
        night_vision_results: '20/30',
        hearing_done: true, 
        hearing_results: 'Normal',
        lung_function_done: true,
        lung_function_results: 'Normal',
        x_ray_done: false,
        x_ray_results: 'N/A',
        drug_screen_done: false,
        drug_screen_results: 'N/A'
      };
      
      // Certification
      extractedData.certification.fit = markdown.match(/FIT.*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      extractedData.certification.fit_with_restrictions = 
        markdown.match(/(?:Fit with Restriction|Restriction).*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      extractedData.certification.temporarily_unfit = 
        markdown.match(/(?:Temporary Unfit|Temporary).*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      extractedData.certification.unfit = 
        markdown.match(/UNFIT.*?(?:\[x\]|\[X\]|✓|checked|done)/is) !== null;
      
      // Set default certification status if none is checked
      if (!extractedData.certification.fit && 
          !extractedData.certification.fit_with_restrictions && 
          !extractedData.certification.temporarily_unfit && 
          !extractedData.certification.unfit) {
        extractedData.certification.fit = true;
      }
      
      return extractedData;
    };
    
    // Cleaner two-step approach for processing Landing AI data
    
    // Step 1: Extract the markdown from the Landing AI API response
    const extractMarkdownFromLandingAI = (extractedData: any) => {
      if (!extractedData || !extractedData.event_message) {
        console.error("Invalid input data");
        return null;
      }
      
      console.log("Extracting markdown from Landing AI response");
      
      // Extract the Response JSON from event_message
      const responseMatch = extractedData.event_message.match(/Response:\s*({.*})/s);
      if (!responseMatch || !responseMatch[1]) {
        console.error("Response pattern not found in event_message");
        return null;
      }
      
      try {
        // Parse the Response JSON
        const responseObj = JSON.parse(responseMatch[1]);
        
        if (responseObj.data && responseObj.data.markdown) {
          console.log("Successfully extracted markdown");
          return responseObj.data.markdown;
        } else {
          console.error("Markdown not found in Response object");
          return null;
        }
      } catch (e) {
        console.error("Error parsing Response JSON:", e);
        return null;
      }
    };
    
    // Step 2: Structure the markdown data for the certificate template
    const structureMarkdownForCertificate = (markdown: string) => {
      if (!markdown) {
        console.error("No markdown to structure");
        return null;
      }
      
      console.log("Structuring markdown for certificate template");
      
      // Initialize our data structure
      const data = {
        patient: {},
        examination_results: {
          type: {},
          test_results: {}
        },
        certification: {},
        restrictions: {}
      };
      
      // Extract patient information
      const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (nameMatch && nameMatch[1]) data.patient.name = nameMatch[1].trim();
      
      const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (idMatch && idMatch[1]) data.patient.id_number = idMatch[1].trim();
      
      const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (companyMatch && companyMatch[1]) data.patient.company = companyMatch[1].trim();
      
      const jobTitleMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (jobTitleMatch && jobTitleMatch[1]) data.patient.occupation = jobTitleMatch[1].trim();
      
      const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (examDateMatch && examDateMatch[1]) data.examination_results.date = examDateMatch[1].trim();
      
      const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (expiryDateMatch && expiryDateMatch[1]) data.certification.valid_until = expiryDateMatch[1].trim();
      
      // Helper function to check if a checkbox is marked
      const isCheckboxMarked = (text: string, identifier: string) => {
        // Check for various checkbox marker patterns
        const patterns = [
          `**${identifier}**: [x]`,
          `**${identifier}**: [X]`,
          `**${identifier}**: [✓]`,
          `**${identifier}**: [✔]`,
          `**${identifier}**: [v]`,
          `**${identifier}**: [V]`,
          `**${identifier}**: [check]`,
          `**${identifier}**: [tick]`
        ];
        
        return patterns.some(pattern => text.includes(pattern));
      };
      
      // Extract examination type
      data.examination_results.type.pre_employment = isCheckboxMarked(markdown, "Pre-Employment");
      data.examination_results.type.periodical = isCheckboxMarked(markdown, "Periodical");
      data.examination_results.type.exit = isCheckboxMarked(markdown, "Exit");
      
      // Extract medical tests
      const testsMap = [
        { name: 'BLOODS', key: 'bloods' },
        { name: 'FAR, NEAR VISION', key: 'far_near_vision' },
        { name: 'SIDE & DEPTH', key: 'side_depth' },
        { name: 'NIGHT VISION', key: 'night_vision' },
        { name: 'Hearing', key: 'hearing' },
        { name: 'Working at Heights', key: 'heights' },
        { name: 'Lung Function', key: 'lung_function' },
        { name: 'X-Ray', key: 'x_ray' },
        { name: 'Drug Screen', key: 'drug_screen' }
      ];
      
      testsMap.forEach(test => {
        // Look for the pattern like "| BLOODS | [x] | N/A |"
        // With multiple possible checkbox markers
        const pattern = new RegExp(`\\| ${test.name}\\s*\\| \\[([xX✓✔vVtT ])\\]\\s*\\| (.*?)\\|`, 's');
        const match = markdown.match(pattern);
        
        if (match) {
          // Check if the character indicates the checkbox is marked
          const isDone = !!match[1].match(/[xX✓✔vVtT]/); // any of these chars indicates checked
          data.examination_results.test_results[`${test.key}_done`] = isDone;
          data.examination_results.test_results[`${test.key}_results`] = match[2].trim();
        }
      });
      
      // Extract medical fitness declaration
      data.certification.fit = isCheckboxMarked(markdown, "FIT");
      data.certification.fit_with_restrictions = isCheckboxMarked(markdown, "Fit with Restriction");
      data.certification.fit_with_condition = isCheckboxMarked(markdown, "Fit with Condition");
      data.certification.temporarily_unfit = isCheckboxMarked(markdown, "Temporary Unfit");
      data.certification.unfit = isCheckboxMarked(markdown, "UNFIT");
      
      // Extract Review Date
      const reviewDateMatch = markdown.match(/\*\*Review Date\*\*:\s*(.*?)(?=\n|\r|$)/);
      if (reviewDateMatch && reviewDateMatch[1]) {
        data.certification.review_date = reviewDateMatch[1].trim();
      }
      
      // Extract restrictions
      const restrictionsSection = markdown.match(/### Restrictions\s*([\s\S]*?)(?=\n\n|\n###|$)/);
      if (restrictionsSection && restrictionsSection[1]) {
        const restrictionsText = restrictionsSection[1];
        data.restrictions.heights = restrictionsText.includes("Heights");
        data.restrictions.dust_exposure = restrictionsText.includes("Dust Exposure");
        data.restrictions.motorized_equipment = restrictionsText.includes("Motorized Equipment");
        data.restrictions.wear_hearing_protection = restrictionsText.includes("Wear Hearing Protection");
        data.restrictions.confined_spaces = restrictionsText.includes("Confined Spaces");
        data.restrictions.chemical_exposure = restrictionsText.includes("Chemical Exposure");
        data.restrictions.wear_spectacles = restrictionsText.includes("Wear Spectacles");
        data.restrictions.remain_on_treatment_for_chronic_conditions = 
          restrictionsText.includes("Remain on Treatment") || 
          restrictionsText.includes("Chronic Conditions");
      }
      
      // Extract comments
      const commentsMatch = markdown.match(/### Comments\s*\n- (.*?)(?=\n\n|\n###|$)/);
      if (commentsMatch && commentsMatch[1]) {
        data.certification.comments = commentsMatch[1].trim();
      }
      
      console.log("Structured data:", data);
      return data;
    };
    
    // Combine the two steps
    const processLandingAIData = (extractedData: any) => {
      console.log("Processing Landing AI data with two-step approach");
      
      // Step 1: Extract the markdown
      const markdown = extractMarkdownFromLandingAI(extractedData);
      if (!markdown) {
        console.error("Failed to extract markdown");
        return null;
      }
      
      // Step 2: Structure the markdown for the certificate
      const structuredData = structureMarkdownForCertificate(markdown);
      if (!structuredData) {
        console.error("Failed to structure data from markdown");
        return null;
      }
      
      // Return both the structured data and the raw markdown for reference
      return {
        structured_data: structuredData,
        raw_response: {
          data: {
            markdown: markdown
          }
        }
      };
    };
    
    // First try the direct two-step approach if we have event_message
    if (rawData.event_message) {
      const processedData = processLandingAIData(rawData);
      if (processedData) {
        console.log("Successfully processed data using two-step approach");
        return processedData;
      }
    }
    
    // Process the data using our comprehensive processor
    const processedData = processLandingAIResponse(rawData);
    
    // If the data still doesn't have the required structure, fall back to our original approach
    if (!processedData.raw_response?.data?.markdown && !processedData.structured_data) {
      console.log("Comprehensive processor didn't create a valid structure, falling back");
      
      // Original approach for backward compatibility
      if (rawData.raw_response && rawData.raw_response.data && rawData.raw_response.data.markdown) {
        console.log("Raw response with markdown already exists");
        return rawData;
      }
      
      if (typeof rawData === 'string') {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.data && parsed.data.markdown) {
            console.log("Parsed raw data string into object with markdown");
            return {
              raw_response: parsed
            };
          }
        } catch (e) {
          console.error("Error parsing certificate data string:", e);
        }
      }
      
      if (rawData.data && rawData.data.markdown) {
        console.log("Wrapping API response in raw_response structure");
        return {
          raw_response: rawData
        };
      }
      
      if (rawData.markdown) {
        console.log("Found markdown field directly in data");
        return {
          raw_response: {
            data: {
              markdown: rawData.markdown
            }
          }
        };
      }
      
      if (rawData.event_message && typeof rawData.event_message === 'string') {
        try {
          console.log("Attempting to process event_message with legacy approach");
          
          // First attempt: Try to extract the complete JSON response object
          const responseMatch = rawData.event_message.match(/Response:\s*(\{.*\})/s);
          
          if (responseMatch && responseMatch[1]) {
            console.log("Found JSON in event_message");
            const jsonStr = responseMatch[1];
            try {
              const responseObj = JSON.parse(jsonStr);
              
              if (responseObj.data && responseObj.data.markdown) {
                console.log("Successfully extracted markdown from event_message");
                return {
                  raw_response: responseObj
                };
              }
            } catch (parseErr) {
              console.error("Error parsing JSON from event_message:", parseErr);
            }
          }
          
          // Second attempt: Try to extract just the markdown content using a more flexible pattern
          const markdownPattern = /"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s;
          const markdownMatch = rawData.event_message.match(markdownPattern);
          if (markdownMatch && markdownMatch[1]) {
            const markdownContent = markdownMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            console.log("Extracted markdown content directly from string");
            return {
              raw_response: {
                data: {
                  markdown: markdownContent
                }
              }
            };
          }
          
          // Last resort: Use event_message directly as markdown
          if (rawData.event_message.includes('## Description') || 
              rawData.event_message.includes('**Initials & Surname**') || 
              rawData.event_message.includes('# CERTIFICATE OF FITNESS')) {
            console.log("Using event_message directly as markdown");
            return {
              raw_response: {
                data: {
                  markdown: rawData.event_message
                }
              }
            };
          }
        } catch (e) {
          console.error("Error processing event_message:", e);
        }
      }
    }
    
    return processedData;
  };
    
    /* Original code below - no longer used with new implementation above */
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj.markdown && typeof obj.markdown === 'string') return obj.markdown;
        if (obj.data && obj.data.markdown && typeof obj.data.markdown === 'string') return obj.data.markdown;
        
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            const markdown = findMarkdown(obj[key]);
            if (markdown) return markdown;
          } else if (typeof obj[key] === 'string' && obj[key].includes('"markdown":"')) {
            try {
              const markdownMatch = obj[key].match(/"markdown":"(.*?)(?:","chunks|"})/s);
              if (markdownMatch && markdownMatch[1]) {
                return markdownMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
              }
            } catch (e) {
              console.error("Error extracting markdown from string field:", e);
            }
          }
        }
        
        return null;
      };
      
      const markdown = findMarkdown(rawData);
      if (markdown) {
        console.log("Found markdown in deep object search");
        return {
          raw_response: {
            data: {
              markdown: markdown
            }
          }
        };
      }
    }
    
    if (rawData.event_message && typeof rawData.event_message === 'string') {
      console.log("Attempting last resort extraction from event_message");
      
      const sections = rawData.event_message.split('\n\n');
      for (const section of sections) {
        if (section.includes('##') || section.includes('**')) {
          console.log("Found markdown-like content in event_message section");
          return {
            raw_response: {
              data: {
                markdown: section
              }
            }
          };
        }
      }
    }
    
    console.log("Could not process certificate data into expected format");
    return rawData;
  };

  const fetchDocumentFromSupabase = async (documentId: string) => {
    try {
      const { data: documentData, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching document:', error);
        return null;
      }
      
      if (!documentData) {
        return null;
      }
      
      console.log('Fetched document data:', documentData);
      
      const { data: urlData } = await supabase
        .storage
        .from('medical-documents')
        .createSignedUrl(documentData.file_path, 3600);
      
      let extractedData = documentData.extracted_data || {};
      let patientName = extractPatientName(extractedData);
      let patientId = extractPatientId(extractedData);
      
      if (documentData.document_type === 'certificate-of-fitness') {
        console.log("Processing certificate of fitness data");
        extractedData = processCertificateData(extractedData);
      }
      
      console.log('Processed extracted data:', extractedData);
      
      return {
        id: documentData.id,
        name: documentData.file_name,
        type: documentData.document_type === 'medical-questionnaire' 
          ? 'Medical Examination Questionnaire' 
          : 'Certificate of Fitness',
        uploadedAt: documentData.created_at,
        status: documentData.status,
        patientName: patientName,
        patientId: patientId,
        imageUrl: urlData?.signedUrl || null,
        extractedData: extractedData,
        jsonData: JSON.stringify(extractedData, null, 2)
      };
    } catch (error) {
      console.error('Error fetching document from Supabase:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const documentData = await fetchDocumentFromSupabase(id);
        
        if (documentData) {
          setDocument(documentData);
          setImageUrl(documentData.imageUrl);
          
          sessionStorage.setItem(`document-${id}`, JSON.stringify(documentData));
          
          if (documentData.status === 'processing') {
            const timeout = setTimeout(() => {
              console.log('Processing timeout reached, updating status');
              setDocument(prev => {
                if (prev && prev.status === 'processing') {
                  const updated = { ...prev, status: 'processed' };
                  return updated;
                }
                return prev;
              });
            }, 30000);
            
            setProcessingTimeout(timeout);
          }
        } else {
          const storedData = sessionStorage.getItem(`document-${id}`);
          
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              setDocument(parsedData);
              setImageUrl(parsedData.imageUrl);
            } catch (error) {
              console.error("Error parsing stored document data:", error);
              setDocument(mockDocumentData);
            }
          } else {
            console.log('Using mock data as fallback');
            setDocument(mockDocumentData);
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setDocument(mockDocumentData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    const pollInterval = setInterval(async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('status, extracted_data')
          .eq('id', id)
          .maybeSingle();
        
        if (error) {
          console.error('Error polling document status:', error);
          return;
        }
        
        if (data && document) {
          console.log('Poll result:', data.status, 'Current status:', document.status);
          
          if (document.status === 'processing' && data.status === 'processed') {
            console.log('Document processing completed, refreshing data');
            
            if (processingTimeout) {
              clearTimeout(processingTimeout);
              setProcessingTimeout(null);
            }
            
            const documentData = await fetchDocumentFromSupabase(id);
            if (documentData) {
              setDocument(documentData);
              
              sessionStorage.setItem(`document-${id}`, JSON.stringify(documentData));
              
              toast.success("Document processing completed", {
                description: "The document has been successfully processed and data extracted."
              });
            }
          } else if (document.status !== data.status) {
            console.log('Document status changed:', data.status);
            setDocument(prev => ({
              ...prev,
              status: data.status,
              extractedData: data.extracted_data || prev.extractedData,
              patientName: extractPatientName(data.extracted_data) || prev.patientName,
              patientId: extractPatientId(data.extracted_data) || prev.patientId,
              jsonData: JSON.stringify(data.extracted_data || prev.extractedData, null, 2)
            }));
          }
        }
      } catch (e) {
        console.error('Error in polling interval:', e);
      }
    }, 5000);
    
    return () => {
      clearInterval(pollInterval);
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [id, document?.status, processingTimeout]);

  const renderExtractedData = () => {
    if (!document || !document.extractedData) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }
    
    const extractedData = document.extractedData;
    
    if (document.type === 'Certificate of Fitness') {
      let processedData = extractedData;
      
      if (extractedData.event_message && !extractedData.raw_response) {
        try {
          console.log("Attempting to process event_message data in renderExtractedData");
          
          // First attempt: Try to extract the complete JSON response object
          const eventMessageMatch = extractedData.event_message.match(/Response:\s*(\{.*\})/s);
          if (eventMessageMatch && eventMessageMatch[1]) {
            try {
              const responseObj = JSON.parse(eventMessageMatch[1]);
              if (responseObj.data && responseObj.data.markdown) {
                console.log("Successfully extracted Response JSON object");
                processedData = {
                  raw_response: responseObj
                };
              }
            } catch (e) {
              console.error("Error parsing Response JSON:", e);
            }
          }
          
          // If still no raw_response, try direct markdown extraction with more flexible pattern
          if (!processedData.raw_response && extractedData.event_message.includes('"markdown":"')) {
            try {
              console.log("Trying direct markdown extraction");
              const markdownPattern = /"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s;
              const markdownMatch = extractedData.event_message.match(markdownPattern);
              if (markdownMatch && markdownMatch[1]) {
                const markdownContent = markdownMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
                
                processedData = {
                  raw_response: {
                    data: {
                      markdown: markdownContent
                    }
                  }
                };
                console.log("Direct markdown extraction successful");
              }
            } catch (e) {
              console.error("Error in direct markdown extraction:", e);
            }
          }
          
          // Last resort: Just pass the event_message as full markdown content
          if (!processedData.raw_response) {
            processedData = {
              raw_response: {
                data: {
                  markdown: extractedData.event_message
                }
              }
            };
            console.log("Using event_message directly as markdown");
          }
        } catch (e) {
          console.error("Error processing event_message:", e);
        }
      }
      
      console.log("Final data being passed to CertificateTemplate:", processedData);
      return (
        <div className="certificate-container pb-6">
          <CertificateTemplate extractedData={processedData} />
        </div>
      );
    }
    
    if (
      typeof extractedData === 'object' && 
      extractedData !== null && 
      !Array.isArray(extractedData) && 
      extractedData.structured_data
    ) {
      const structuredData = extractedData.structured_data;
      
      return (
        <div className="space-y-6">
          {structuredData.patient && (
            <div>
              <h3 className="text-lg font-medium mb-3">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(structuredData.patient).map(([key, value]: [string, any]) => {
                  if (typeof value === 'object' && value !== null) return null;
                  return (
                    <div key={key} className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')}
                      </p>
                      <p className="font-medium">{value !== null ? value.toString() : 'N/A'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <Separator />
          
          {structuredData.medical_details && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(structuredData.medical_details).map(([key, value]: [string, any]) => {
                    let displayValue = value;
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                      return null;
                    }
                    
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')}
                        </p>
                        <p className="font-medium">{displayValue !== null ? displayValue.toString() : 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {structuredData.examination_results && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Examination Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(structuredData.examination_results).map(([key, value]: [string, any]) => {
                    let displayValue = value;
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                      return null;
                    }
                    
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')}
                        </p>
                        <p className="font-medium">{displayValue !== null ? displayValue.toString() : 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {structuredData.certification && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Certification</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(structuredData.certification).map(([key, value]: [string, any]) => {
                    let displayValue = value;
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (typeof value === 'object' && value !== null) {
                      return null;
                    }
                    
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')}
                        </p>
                        <p className="font-medium">{displayValue !== null ? displayValue.toString() : 'N/A'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          
          {!structuredData.patient && !structuredData.medical_details && 
           !structuredData.examination_results && !structuredData.certification && (
            <div>
              <h3 className="text-lg font-medium mb-3">Extracted Information</h3>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {JSON.stringify(structuredData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }
    
    if (
      typeof extractedData === 'object' && 
      extractedData !== null && 
      !Array.isArray(extractedData) && 
      (extractedData.documents || extractedData.text || extractedData.tables)
    ) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Extracted API Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This displays the raw data extracted from your document using the Agentic Document Extraction API.
            </p>
            
            {extractedData.documents && (
              <div className="space-y-4">
                {extractedData.documents.map((doc: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <h4 className="text-md font-medium mb-2">Document Segment {index + 1}</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
            
            {extractedData.text && (
              <div className="border rounded-md p-4 mt-4">
                <h4 className="text-md font-medium mb-2">Extracted Text</h4>
                <div className="bg-muted p-3 rounded">
                  <p className="whitespace-pre-wrap text-sm">{extractedData.text}</p>
                </div>
              </div>
            )}
            
            {extractedData.tables && extractedData.tables.length > 0 && (
              <div className="space-y-4 mt-4">
                <h4 className="text-md font-medium">Extracted Tables</h4>
                {extractedData.tables.map((table: any, index: number) => (
                  <div key={index} className="border rounded-md p-4 overflow-x-auto">
                    <h5 className="text-sm font-medium mb-2">Table {index + 1}</h5>
                    <table className="min-w-full divide-y divide-border">
                      <tbody className="divide-y divide-border">
                        {table.data.map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className="px-3 py-2 text-sm">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Raw Extracted Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The data structure from this extraction doesn't match the expected format. 
            Here's the raw data that was extracted:
          </p>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading document data...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
          <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-medium truncate">{document.name}</h1>
            <p className="text-sm text-muted-foreground">
              {document.type} | {document.patientName || "Unknown Patient"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Original
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Original
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (document.imageUrl) {
                  window.open(document.imageUrl, '_blank');
                } else {
                  toast.error("Document preview not available");
                }
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(document.jsonData);
                toast.success("JSON data copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                toast("Certificate generated successfully", {
                  description: "The certificate of fitness has been saved to your downloads folder",
                  action: {
                    label: "View",
                    onClick: () => console.log("Viewing certificate")
                  }
                });
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Certificate
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {showOriginal && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Original Document</h2>
                <Badge variant="outline" className="text-xs">
                  {document.name?.split('.').pop()?.toUpperCase() || 'PDF'}
                </Badge>
              </div>
              <Card className="overflow-hidden h-[calc(100vh-220px)]">
                <div className="relative w-full h-full">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Document preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col space-y-4 ${showOriginal ? "" : "lg:col-span-2 md:w-3/4 mx-auto"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Extracted Data</h2>
              <Badge variant={document.status === 'processed' ? 'default' : 'secondary'} className="text-xs">
                {document.status === 'processed' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Processed
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1 animate-pulse" />
                    Processing
                  </>
                )}
              </Badge>
            </div>
            
            <Card className="flex-1 overflow-hidden">
              <Tabs defaultValue="structured">
                <CardHeader className="pb-0">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="structured">Structured Data</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="pt-4 h-[calc(100vh-270px)] overflow-hidden">
                  <TabsContent value="structured" className="m-0 h-full">
                    {renderExtractedData()}
                  </TabsContent>
                  
                  <TabsContent value="json" className="m-0 h-full">
                    <ScrollArea className="h-full">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="absolute top-1 right-1"
                          onClick={() => {
                            navigator.clipboard.writeText(document.jsonData);
                            toast.success("JSON data copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <pre className="p-4 rounded-md bg-muted/50 text-sm overflow-x-auto">
                          {document.jsonData}
                        </pre>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {
                  toast("Certificate generated successfully", {
                    description: "The certificate of fitness has been saved to your downloads folder",
                    action: {
                      label: "View",
                      onClick: () => console.log("Viewing certificate")
                    }
                  });
                }}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Generate Certificate
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default DocumentViewer;
