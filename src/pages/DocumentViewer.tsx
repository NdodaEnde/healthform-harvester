
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock,
  Check, Pencil, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
        imageUrl: urlData?.signedUrl || null,
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
        <td className="border border-gray-400 p-2 text-center">
          <div className="flex items-center justify-center">
            <Checkbox 
              checked={!!restrictions[key]} 
              onCheckedChange={(checked) => updateEditableData(['structured_data', 'restrictions', key], !!checked)}
              className="mx-auto"
            />
            <span className="ml-2">{label}</span>
          </div>
        </td>
      );
      
      return (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Restrictions</h3>
          <table className="w-full border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 py-1 text-center bg-yellow-50 text-sm" colSpan={3}>
                  RESTRICTIONS APPLICABLE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {renderRestrictionCell("Work at Heights", "heights")}
                {renderRestrictionCell("Confined Spaces", "confined_spaces")}
                {renderRestrictionCell("Fire Fighting", "fire_fighting")}
              </tr>
              <tr>
                {renderRestrictionCell("Heavy Physical Work", "heavy_physical")}
                {renderRestrictionCell("Driving", "driving")}
                {renderRestrictionCell("None", "none")}
              </tr>
            </tbody>
          </table>
        </div>
      );
    };

    // Render all certificate sections
    return (
      <div className="space-y-6 p-4">
        {renderPatientSection()}
        {renderExaminationTypeSection()}
        {renderTestResultsSection()}
        {renderFollowUpSection()}
        {renderRestrictionsSection()}
      </div>
    );
  };

  // useEffect for fetching the document
  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      
      try {
        if (id) {
          // Try to get from session storage first
          const cachedDocument = sessionStorage.getItem(`document-${id}`);
          
          if (cachedDocument) {
            const parsedDocument = JSON.parse(cachedDocument);
            setDocument(parsedDocument);
            setImageUrl(parsedDocument.imageUrl);
            setIsLoading(false);
            return;
          }
          
          const documentData = await fetchDocumentFromSupabase(id);
          
          if (documentData) {
            // Store in session storage for faster retrieval
            sessionStorage.setItem(`document-${id}`, JSON.stringify(documentData));
            setDocument(documentData);
            setImageUrl(documentData.imageUrl);
          } else {
            // Handle case where document not found
            toast.error("Document not found", {
              description: "The document you are trying to view may have been deleted or moved."
            });
            // Optionally navigate back
            // navigate("/documents");
          }
        } else {
          // For development/preview purposes with mockData
          setDocument(mockDocumentData);
          setImageUrl(mockDocumentData.imageUrl);
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Error loading document", {
          description: "There was a problem fetching the document. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
    
    return () => {
      // Cleanup: clear any processing timeouts
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [id, refreshKey]); // Refresh on id change or when refreshKey changes

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-500" />
        <p className="text-gray-600">Loading document...</p>
      </div>
    );
  }

  // Render document not found
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
        <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
        <p className="text-gray-600 mb-4">The document you are looking for could not be found.</p>
        <Button onClick={() => navigate("/documents")}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Document Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/documents")} 
              className="mr-3"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{document.name}</h1>
            <Badge className="ml-3" variant={document.status === 'processed' ? 'success' : 'warning'}>
              {document.status === 'processed' ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Processed</>
              ) : (
                <><Clock className="h-3 w-3 mr-1" /> Processing</>
              )}
            </Badge>
          </div>
          <div className="flex items-center mt-2 text-gray-600">
            <span className="text-sm">Document Type: {document.type}</span>
            <span className="mx-2">•</span>
            <span className="text-sm">Patient: {document.patientName} ({document.patientId})</span>
            <span className="mx-2">•</span>
            <span className="text-sm">Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(document.imageUrl, '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(document.jsonData);
              toast.success("Copied to clipboard", {
                description: "The document data has been copied to your clipboard."
              });
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Data
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? (
              <><Eye className="h-4 w-4 mr-2" />View Original</>
            ) : (
              <><EyeOff className="h-4 w-4 mr-2" />Hide Original</>
            )}
          </Button>
          {document.status === 'processed' && (
            <Button 
              variant={isEditing ? "destructive" : "default"} 
              size="sm" 
              onClick={isEditing ? toggleEditMode : toggleEditMode}
            >
              {isEditing ? (
                <><X className="h-4 w-4 mr-2" />Cancel</>
              ) : (
                <><Pencil className="h-4 w-4 mr-2" />Edit Data</>
              )}
            </Button>
          )}
          {isEditing && (
            <Button 
              variant="success" 
              size="sm" 
              onClick={handleSaveEdits}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Document */}
        {showOriginal && (
          <Card className="shadow-md">
            <CardContent className="p-0">
              {imageUrl && document.status === 'processed' ? (
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt="Document Preview" 
                    className="w-full rounded-t-lg"
                    style={{ maxHeight: '800px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
                  {document.status === 'processing' ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-500" />
                      <p className="text-gray-600">Processing document...</p>
                    </>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-gray-600">Preview not available</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extracted Data */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-4">
              <ClipboardCheck className="inline-block h-5 w-5 mr-2 text-green-600" />
              Extracted Data
            </h2>
            <div className="border rounded-md">
              <ScrollArea className="h-[600px]">
                {document.type === 'Certificate of Fitness' ? (
                  renderCertificateSection(isEditing ? editableData : document.extractedData)
                ) : (
                  <div className="p-4 space-y-6">
                    {Object.entries((isEditing ? editableData : document.extractedData) || {}).map(
                      ([section, data]) => {
                        if (section === 'edit_tracking') return null;
                        if (typeof data !== 'object' || data === null) return null;
                        
                        const sectionTitle = section
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        
                        return (
                          <div key={section} className="mb-6">
                            {renderStructuredSection(sectionTitle, data, [section])}
                            {section !== Object.entries((isEditing ? editableData : document.extractedData) || {}).slice(-1)[0][0] && (
                              <Separator className="my-4" />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentViewer;
