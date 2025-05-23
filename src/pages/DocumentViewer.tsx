import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock,
  Check, Pencil, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import CertificateTemplate from "@/components/CertificateTemplate";
import CertificateValidator from "@/components/CertificateValidator";
import { mapExtractedDataToValidatorFormat } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

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
  const [isValidating, setIsValidating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [validatorData, setValidatorData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);

  const toggleEditMode = () => {
    if (!isEditing) {
      setOriginalData(JSON.parse(JSON.stringify(document.extractedData)));
      setEditableData(JSON.parse(JSON.stringify(document.extractedData)));
    } else {
      setEditableData(null);
      setOriginalData(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdits = async () => {
    if (!editableData) return;
    
    try {
      console.log('Saving edited data:', editableData);
      
      const trackEdits = (original: any, edited: any, path: string[] = []): Record<string, any> => {
        if (!original || !edited) return {};
        
        let edits: Record<string, any> = {};
        
        if (typeof original !== 'object' || typeof edited !== 'object') {
          if (original !== edited) {
            return { [path.join('.')]: { original, edited } };
          }
          return {};
        }
        
        if (Array.isArray(original) || Array.isArray(edited)) {
          if (JSON.stringify(original) !== JSON.stringify(edited)) {
            return { [path.join('.')]: { original, edited } };
          }
          return {};
        }
        
        const allKeys = [...new Set([...Object.keys(original), ...Object.keys(edited)])];
        
        for (const key of allKeys) {
          if (key === 'edit_tracking') continue;
          
          const newPath = [...path, key];
          
          if (!(key in original)) {
            edits[newPath.join('.')] = { original: undefined, edited: edited[key] };
          } else if (!(key in edited)) {
            edits[newPath.join('.')] = { original: original[key], edited: undefined };
          } else if (typeof original[key] === 'object' && original[key] !== null && 
                    typeof edited[key] === 'object' && edited[key] !== null) {
            const nestedEdits = trackEdits(original[key], edited[key], newPath);
            edits = { ...edits, ...nestedEdits };
          } else if (original[key] !== edited[key]) {
            edits[newPath.join('.')] = { original: original[key], edited: edited[key] };
          }
        }
        
        return edits;
      };
      
      const edits = trackEdits(originalData, editableData);
      const hasEdits = Object.keys(edits).length > 0;
      
      if (hasEdits) {
        const existingTracking = editableData.edit_tracking || {};
        
        const dataWithTracking = {
          ...editableData,
          edit_tracking: {
            ...existingTracking,
            ...edits,
            last_edited_at: new Date().toISOString(),
          }
        };
        
        setDocument(prev => {
          if (!prev) return null;
          
          const updatedDoc = {
            ...prev,
            extractedData: dataWithTracking,
            jsonData: JSON.stringify(dataWithTracking, null, 2)
          };
          
          if (id) {
            sessionStorage.setItem(`document-${id}`, JSON.stringify(updatedDoc));
          }
          
          return updatedDoc;
        });
        
        if (id) {
          const { error } = await supabase
            .from('documents')
            .update({
              extracted_data: dataWithTracking as Json,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
          if (error) {
            console.error('Error saving edited data to Supabase:', error);
            toast.error("Failed to save changes", {
              description: "There was an error saving your changes to the database."
            });
            return;
          }
        }
      } else {
        setDocument(prev => {
          if (!prev) return null;
          
          const updatedDoc = {
            ...prev,
            extractedData: editableData,
            jsonData: JSON.stringify(editableData, null, 2)
          };
          
          if (id) {
            sessionStorage.setItem(`document-${id}`, JSON.stringify(updatedDoc));
          }
          
          return updatedDoc;
        });
        
        if (id) {
          const { error } = await supabase
            .from('documents')
            .update({
              extracted_data: editableData as Json,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
          if (error) {
            console.error('Error saving edited data to Supabase:', error);
            toast.error("Failed to save changes", {
              description: "There was an error saving your changes to the database."
            });
            return;
          }
        }
      }
      
      setIsEditing(false);
      setEditableData(null);
      setOriginalData(null);
      
      toast.success("Changes saved", {
        description: hasEdits 
          ? "Your edits have been saved and will contribute to accuracy metrics." 
          : "Your edits have been saved successfully."
      });
    } catch (error) {
      console.error('Exception saving edited data:', error);
      toast.error("Failed to save changes", {
        description: "There was an error saving your changes. Please try again."
      });
    }
  };

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
        const idPatterns = [
          /\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i,
          /\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i,
          /ID No[.:]\s*(.*?)(?=\n|\r|$)/i,
          /ID NO[.:]\s*(.*?)(?=\n|\r|$)/i
        ];
        
        for (const pattern of idPatterns) {
          const idMatch = markdown.match(pattern);
          if (idMatch && idMatch[1]) return idMatch[1].trim();
        }
      }
    }
    
    if (typeof extractedData === 'object') {
      const findPatientId = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj.patient && obj.patient.id_number) return obj.patient.id_number;
        if (obj.patient && obj.patient.employee_id) return obj.patient.employee_id;
        if (obj.patient && obj.patient.id) return obj.patient.id;
        if (obj.id_number && typeof obj.id_number === 'string') return obj.id_number;
        if (obj.patient_id && typeof obj.patient_id === 'string') return obj.patient_id;
        if (obj.employee_id && typeof obj.employee_id === 'string') return obj.employee_id;
        
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

  // MINIMAL FIX: Only improve the URL handling in your existing fetchDocumentFromSupabase
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
    console.log('File path:', documentData.file_path);
    
    // ENHANCED: Better URL handling (only change from your working version)
    let signedUrl = null;
    try {
      const { data: urlData, error: urlError } = await supabase
        .storage
        .from('medical-documents')
        .createSignedUrl(documentData.file_path, 3600);
      
      if (urlError) {
        console.error('Signed URL error:', urlError);
        // Try public URL as fallback
        const { data: publicUrlData } = supabase
          .storage
          .from('medical-documents')
          .getPublicUrl(documentData.file_path);
        
        signedUrl = publicUrlData?.publicUrl || null;
        console.log('Using public URL fallback:', signedUrl);
      } else {
        signedUrl = urlData?.signedUrl || null;
        console.log('Using signed URL:', signedUrl);
      }
    } catch (urlException) {
      console.error('Exception getting URL:', urlException);
      signedUrl = null;
    }
    
    // Rest of your existing code remains the same...
    let extractedData = documentData.extracted_data || {};
    
    if (documentData.document_type === 'certificate-of-fitness') {
      console.log('Before mapping:', extractedData);
      extractedData = mapExtractedDataToValidatorFormat(extractedData);
      console.log('After mapping:', extractedData);
    }
    
    let patientName = extractPatientName(extractedData);
    let patientId = extractPatientId(extractedData);
    
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
      imageUrl: signedUrl, // Now with better error handling
      extractedData: extractedData,
      jsonData: JSON.stringify(extractedData, null, 2)
    };
  } catch (error) {
    console.error('Error fetching document from Supabase:', error);
    return null;
  }
};

  const updateEditableData = (path: string[], value: any) => {
    setEditableData((prev: any) => {
      if (!prev) return prev;
      
      const newData = JSON.parse(JSON.stringify(prev));
      
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      return newData;
    });
  };

  const renderStructuredSection = (title: string, data: any, path: string[]) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }
    
    return (
      <div className="px-6">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return null;
            }
            
            const displayKey = key
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
              
            return (
              <div key={key} className="flex items-center">
                <span className="font-semibold mr-1 min-w-32">{displayKey}:</span>
                {isEditing ? (
                  <Input 
                    className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                    value={value as string || ''}
                    onChange={(e) => {
                      const newPath = [...path, key];
                      updateEditableData(newPath, e.target.value);
                    }}
                  />
                ) : (
                  <span className="text-gray-700">{value as string || 'N/A'}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCertificateSection = (data: any) => {
    if (!data || !data.structured_data) return null;
    
    const structuredData = data.structured_data;
    
    const renderPatientSection = () => {
      const patient = structuredData.patient || {};
      
      return (
        <div className="space-y-4 mb-4">
          <h3 className="text-lg font-medium">Patient Information</h3>
          <div className="flex justify-between space-x-4">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">Initials & Surname:</span>
                <Input 
                  className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                  value={patient.name || ''}
                  onChange={(e) => updateEditableData(['structured_data', 'patient', 'name'], e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">ID NO:</span>
                <Input 
                  className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                  value={patient.id_number || patient.employee_id || patient.id || ''}
                  onChange={(e) => {
                    if ('id_number' in patient) {
                      updateEditableData(['structured_data', 'patient', 'id_number'], e.target.value);
                    } else if ('employee_id' in patient) {
                      updateEditableData(['structured_data', 'patient', 'employee_id'], e.target.value);
                    } else {
                      updateEditableData(['structured_data', 'patient', 'id_number'], e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="font-semibold mr-1">Company Name:</span>
            <Input 
              className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
              value={patient.company || ''}
              onChange={(e) => updateEditableData(['structured_data', 'patient', 'company'], e.target.value)}
            />
          </div>
          
          <div className="flex justify-between space-x-4">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">Date of Examination:</span>
                <Input 
                  className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                  value={(structuredData.examination_results?.date) || ''}
                  onChange={(e) => updateEditableData(['structured_data', 'examination_results', 'date'], e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-semibold mr-1">Expiry Date:</span>
                <Input 
                  className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
                  value={(structuredData.certification?.valid_until) || ''}
                  onChange={(e) => updateEditableData(['structured_data', 'certification', 'valid_until'], e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="font-semibold mr-1">Job Title:</span>
            <Input 
              className="border-b border-gray-400 flex-1 bg-transparent p-0 h-6 focus-visible:ring-0 rounded-none shadow-none" 
              value={patient.occupation || ''}
              onChange={(e) => updateEditableData(['structured_data', 'patient', 'occupation'], e.target.value)}
            />
          </div>
        </div>
      );
    };
    
    const renderExaminationTypeSection = () => {
      const examinationType = structuredData.examination_results?.type || {};
      
      return (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Examination Type</h3>
          <table className="w-full border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PRE-EMPLOYMENT</th>
                <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PERIODICAL</th>
                <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">EXIT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 h-8 text-center">
                  <Checkbox 
                    checked={!!examinationType.pre_employment} 
                    onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'pre_employment'], !!checked)}
                    className="mx-auto"
                  />
                </td>
                <td className="border border-gray-400 h-8 text-center">
                  <Checkbox 
                    checked={!!examinationType.periodical} 
                    onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'periodical'], !!checked)}
                    className="mx-auto"
                  />
                </td>
                <td className="border border-gray-400 h-8 text-center">
                  <Checkbox 
                    checked={!!examinationType.exit} 
                    onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'type', 'exit'], !!checked)}
                    className="mx-auto"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    };
    
    const renderTestResultsSection = () => {
      const testResults = structuredData.examination_results?.test_results || {};
      
      const renderTestRow = (label: string, doneKey: string, resultsKey: string) => (
        <tr>
          <td className="border border-gray-400 pl-2 text-sm">{label}</td>
          <td className="border border-gray-400 text-center">
            <Checkbox 
              checked={!!testResults[doneKey]} 
              onCheckedChange={(checked) => updateEditableData(['structured_data', 'examination_results', 'test_results', doneKey], !!checked)}
              className="mx-auto"
            />
          </td>
          <td className="border border-gray-400 p-1 text-sm">
            <Input 
              className="w-full border-0 p-0 h-6 bg-transparent shadow-none focus-visible:ring-0" 
              value={testResults[resultsKey] || ''}
              onChange={(e) => updateEditableData(['structured_data', 'examination_results', 'test_results', resultsKey], e.target.value)}
            />
          </td>
        </tr>
      );
      
      return (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Medical Tests</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <table className="w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">Tests</th>
                    <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                    <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTestRow("BLOODS", "bloods_done", "bloods_results")}
                  {renderTestRow("FAR, NEAR VISION", "far_near_vision_done", "far_near_vision_results")}
                  {renderTestRow("SIDE & DEPTH", "side_depth_done", "side_depth_results")}
                  {renderTestRow("NIGHT VISION", "night_vision_done", "night_vision_results")}
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Tests</th>
                    <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                    <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTestRow("Hearing", "hearing_done", "hearing_results")}
                  {renderTestRow("Working at Heights", "heights_done", "heights_results")}
                  {renderTestRow("Lung Function", "lung_function_done", "lung_function_results")}
                  {renderTestRow("X-Ray", "x_ray_done", "x_ray_results")}
                  {renderTestRow("Drug Screen", "drug_screen_done", "drug_screen_results")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };
    
    const renderFollowUpSection = () => {
      const certification = structuredData.certification || {};
      
      return (
        <div className="mb-4">
          <div className="flex items-center">
            <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
            <div className="border-b border-gray-400 flex-1">
              <Input 
                className="border-0 p-0 h-6 w-full bg-transparent shadow-none focus-visible:ring-0" 
                value={certification.follow_up || ''}
                onChange={(e) => updateEditableData(['structured_data', 'certification', 'follow_up'], e.target.value)}
              />
            </div>
            <div className="ml-2">
              <div className="text-sm">
                <span className="font-semibold mr-1">Review Date:</span>
                <Input 
                  className="border-0 border-b border-gray-400 p-0 h-6 w-24 bg-transparent shadow-none focus-visible:ring-0 text-red-600" 
                  value={certification.review_date || ''}
                  onChange={(e) => updateEditableData(['structured_data', 'certification', 'review_date'], e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    const renderRestrictionsSection = () => {
      const restrictions = structuredData.restrictions || {};
      
      const renderRestrictionCell = (label: string, key: string) => (
        <td className={`border border-gray-400 p-2 text-center`}>
          <div className="font-semibold">{label}</div>
          <div className="flex justify-center mt-1">
            <Checkbox 
              checked={!!restrictions[key]} 
              onCheckedChange={(checked) => updateEditableData(['structured_data', 'restrictions', key], !!checked)}
            />
          </div>
        </td>
      );
      
      return (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Restrictions</h3>
          <table className="w-full border border-gray-400 text-sm">
            <tbody>
              <tr>
                {renderRestrictionCell("Heights", "heights")}
                {renderRestrictionCell("Dust Exposure", "dust_exposure")}
                {renderRestrictionCell("Motorized Equipment", "motorized_equipment")}
                {renderRestrictionCell("Wear Hearing Protection", "wear_hearing_protection")}
              </tr>
              <tr>
                {renderRestrictionCell("Confined Spaces", "confined_spaces")}
                {renderRestrictionCell("Chemical Exposure", "chemical_exposure")}
                {renderRestrictionCell("Wear Spectacles", "wear_spectacles")}
                {renderRestrictionCell("Remain on Treatment for Chronic Conditions", "remain_on_treatment_for_chronic_conditions")}
              </tr>
            </tbody>
          </table>
        </div>
      );
    };
    
    const renderFitnessAssessmentSection = () => {
      const certification = structuredData.certification || {};
      
      return (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Fitness Assessment</h3>
          <table className="w-full border border-gray-400">
            <tbody>
              <tr>
                <th className="border border-gray-400 p-2 text-center">
                  FIT
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={!!certification.fit} 
                      onCheckedChange={(checked) => updateEditableData(['structured_data', 'certification', 'fit'], !!checked)}
                    />
                  </div>
                </th>
                <th className="border border-gray-400 p-2 text-center">
                  Fit with Restriction
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={!!certification.fit_with_restrictions} 
                      onCheckedChange={(checked) => updateEditableData(['structured_data', 'certification', 'fit_with_restrictions'], !!checked)}
                    />
                  </div>
                </th>
                <th className="border border-gray-400 p-2 text-center">
                  Fit with Condition
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={!!certification.fit_with_condition} 
                      onCheckedChange={(checked) => updateEditableData(['structured_data', 'certification', 'fit_with_condition'], !!checked)}
                    />
                  </div>
                </th>
                <th className="border border-gray-400 p-2 text-center">
                  Temporary Unfit
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={!!certification.temporarily_unfit} 
                      onCheckedChange={(checked) => updateEditableData(['structured_data', 'certification', 'temporarily_unfit'], !!checked)}
                    />
                  </div>
                </th>
                <th className="border border-gray-400 p-2 text-center">
                  UNFIT
                  <div className="flex justify-center mt-1">
                    <Checkbox 
                      checked={!!certification.unfit} 
                      onCheckedChange={(checked) => updateEditableData(['structured_data', 'certification', 'unfit'], !!checked)}
                    />
                  </div>
                </th>
              </tr>
            </tbody>
          </table>
        </div>
      );
    };
    
    const renderCommentsSection = () => {
      const certification = structuredData.certification || {};
      
      return (
        <div className="mb-4">
          <div className="font-semibold text-sm mb-1">Comments:</div>
          <Textarea 
            className="border border-gray-400 p-2 min-h-16 text-sm w-full resize-none focus-visible:ring-0" 
            value={certification.comments || ''}
            onChange={(e) => updateEditableData(['structured_data', 'certification', 'comments'], e.target.value)}
          />
        </div>
      );
    };
    
    return (
      <div className="space-y-6 px-6">
        {renderPatientSection()}
        <Separator />
        {renderExaminationTypeSection()}
        <Separator />
        {renderTestResultsSection()}
        <Separator />
        {renderFollowUpSection()}
        <Separator />
        {renderRestrictionsSection()}
        <Separator />
        {renderFitnessAssessmentSection()}
        <Separator />
        {renderCommentsSection()}
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditableData(null);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSaveEdits}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  const renderExtractedData = () => {
    if (isValidating && document) {
      console.log('Data passed to validator:', validatorData || document.extractedData);
      
      const dataForValidator = validatorData || mapExtractedDataToValidatorFormat(document.extractedData);
      
      return (
        <CertificateValidator 
          documentId={document.id}
          extractedData={dataForValidator}
          onSave={handleValidationSave}
          onCancel={() => {
            setIsValidating(false);
            setValidatorData(null);
          }}
        />
      );
    }
    
    if (!document || !document.extractedData) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }
    
    const extractedData = isEditing ? editableData : document.extractedData;
    
    if (document.type === 'Certificate of Fitness') {
      if (isEditing) {
        return renderCertificateSection(extractedData);
      }
      
      console.log("Passing to CertificateTemplate:", extractedData);
      return (
        <div className="certificate-container pb-6">
          <CertificateTemplate extractedData={extractedData} />
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
            <>
              {renderStructuredSection("Patient Information", structuredData.patient, ['structured_data', 'patient'])}
              <Separator />
            </>
          )}
          
          {structuredData.medical_details && (
            <>
              {renderStructuredSection("Medical Information", structuredData.medical_details, ['structured_data', 'medical_details'])}
              <Separator />
            </>
          )}
          
          {structuredData.examination_results && (
            <>
              {renderStructuredSection("Examination Results", structuredData.examination_results, ['structured_data', 'examination_results'])}
              <Separator />
            </>
          )}
          
          {structuredData.certification && (
            <>
              {renderStructuredSection("Certification", structuredData.certification, ['structured_data', 'certification'])}
            </>
          )}
          
          {isEditing && (
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditableData(null);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEdits}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
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
  }, [id, document?.status, processingTimeout, refreshKey]);

  const handleValidationSave = async (validatedData: any) => {
    console.log('Saving validated data:', validatedData);
    
    const processedData = mapExtractedDataToValidatorFormat(validatedData) as unknown as Json;
    
    setDocument(prev => {
      if (!prev) return null;
      
      const updatedDoc = {
        ...prev,
        extractedData: processedData,
        jsonData: JSON.stringify(processedData, null, 2),
        validationStatus: 'validated'
      };
      
      if (id) {
        sessionStorage.setItem(`document-${id}`, JSON.stringify(updatedDoc));
      }
      
      return updatedDoc;
    });
    
    setRefreshKey(prevKey => prevKey + 1);
    setValidatorData(null);
    setIsValidating(false);
    
    if (id) {
      try {
        const { error } = await supabase
          .from('documents')
          .update({
            extracted_data: processedData,
            is_validated: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (error) {
          console.error('Error saving validated data to Supabase:', error);
          toast.error("Failed to save validation", {
            description: "There was an error saving your changes to the database."
          });
          return;
        }
      } catch (error) {
        console.error('Exception saving validated data:', error);
        toast.error("Failed to save validation", {
          description: "There was an error saving your changes to the database."
        });
        return;
      }
    }
    
    toast.success("Validation completed", {
      description: "The document data has been validated and saved."
    });
  };

  const prepareValidatorData = () => {
    if (!document) return null;
    
    console.log("Preparing data for validator:", document.extractedData);
    
    const formattedData = mapExtractedDataToValidatorFormat(document.extractedData) as unknown as Record<string, any>;
    
    if (formattedData.structured_data.examination_results) {
      formattedData.structured_data.examination_results.test_results = 
        formattedData.structured_data.examination_results.test_results || {};
      
      formattedData.structured_data.examination_results.type = 
        formattedData.structured_data.examination_results.type || {};
    }
    
    console.log("Formatted data for validator:", formattedData);
    setValidatorData(formattedData);
    return formattedData;
  };

  const startValidation = () => {
    const data = prepareValidatorData();
    console.log("Starting validation with data:", data);
    setIsValidating(true);
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
            <ChevronLeft className="h-4 w-4" />
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
            {!isValidating && !isEditing && document.status === 'processed' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleEditMode}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Data
              </Button>
            )}
            {isEditing && (
              <Button 
                variant="warning" 
                size="sm"
                onClick={toggleEditMode}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Edit
              </Button>
            )}
            {!isValidating && !isEditing && document.validationStatus === 'validated' && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Validated
              </Badge>
            )}
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
            key={`document-content-${refreshKey}-${isEditing ? 'edit' : 'view'}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isValidating ? "Validate Document Data" : (isEditing ? "Edit Document Data" : "Extracted Data")}
              </h2>
              {!isValidating && !isEditing && (
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
              )}
              {isEditing && (
                <Badge variant="secondary" className="text-xs">
                  <Pencil className="h-3 w-3 mr-1" />
                  Editing
                </Badge>
              )}
              {!isValidating && !isEditing && document.validationStatus === 'validated' && (
                <Badge variant="default" className="text-xs ml-2 bg-green-100 text-green-800 hover:bg-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Validated
                </Badge>
              )}
            </div>
            
            <Card className="flex-1 overflow-hidden">
              {isValidating ? (
                <CardContent className="p-0 h-[calc(100vh-270px)] overflow-hidden">
                  {renderExtractedData()}
                </CardContent>
              ) : isEditing ? (
                <CardContent className="p-6 h-[calc(100vh-270px)] overflow-auto">
                  {renderExtractedData()}
                </CardContent>
              ) : (
                <>
                  <Tabs defaultValue="structured">
                    <CardContent className="pb-0 pt-4">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="structured">Structured Data</TabsTrigger>
                        <TabsTrigger value="json">JSON</TabsTrigger>
                      </TabsList>
                    </CardContent>
                    
                    <CardContent className="pt-2 h-[calc(100vh-320px)] overflow-hidden">
                      <TabsContent value="structured" className="m-0 h-full">
                        <ScrollArea className="h-full pr-4">
                          {renderExtractedData()}
                        </ScrollArea>
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
                </>
              )}
            </Card>
            
            {!isValidating && !isEditing && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                {document.status === 'processed' && !isEditing && (
                  <Button
                    onClick={toggleEditMode}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Data
                  </Button>
                )}
                {document.status === 'processed' && !isValidating && !isEditing && (
                  <Button
                    onClick={startValidation}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {document.validationStatus === 'validated' ? 'Edit Validation' : 'Validate Data'}
                  </Button>
                )}
              </div>
            )}
            
            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditableData(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdits}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default DocumentViewer;