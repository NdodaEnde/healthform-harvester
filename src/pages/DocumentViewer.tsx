
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock,
  Check, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import CertificateTemplate from "@/components/CertificateTemplate";
import CertificateValidator from "@/components/CertificateValidator";
import { mapExtractedDataToValidatorFormat } from "@/lib/utils";
import { Json } from "@/integrations/supabase/types";

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
  const [editedData, setEditedData] = useState<any>(null);

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
    if (isEditing) {
      handleSaveEdits();
      return;
    }
    
    setIsEditing(true);
    setEditedData(structureEditableData(document?.extractedData));
  };

  const structureEditableData = (data: any) => {
    if (!data) return {};
    
    if (data.structured_data) {
      return JSON.parse(JSON.stringify(data));
    }
    
    return {
      structured_data: {
        patient: data.patient || {},
        certification: data.certification || {},
        examination_results: data.examination_results || {},
        restrictions: data.restrictions || []
      }
    };
  };

  const handleDataChange = (section: string, key: string, value: any) => {
    setEditedData((prev: any) => {
      if (!prev || !prev.structured_data) return prev;
      
      const updated = { ...prev };
      
      if (!updated.structured_data[section]) {
        updated.structured_data[section] = {};
      }
      
      updated.structured_data[section][key] = value;
      return updated;
    });
  };

  const handleSaveEdits = async () => {
    if (!editedData || !document || !id) {
      toast.error("Error saving changes", {
        description: "No edited data available to save."
      });
      return;
    }
    
    try {
      const processedData = editedData as unknown as Json;
      
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
      setIsEditing(false);
      
      if (id) {
        const { error } = await supabase
          .from('documents')
          .update({
            extracted_data: processedData,
            is_validated: true,
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
      
      toast.success("Changes saved", {
        description: "The document data has been updated."
      });
    } catch (error) {
      console.error('Exception saving edited data:', error);
      toast.error("Failed to save changes", {
        description: "There was an error saving your changes."
      });
    }
  };

  const renderEditableField = (section: string, key: string, value: any, label?: string) => {
    const displayLabel = label || key.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('_', ' ');
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <div className="space-y-1 mb-3">
          <Label htmlFor={`${section}-${key}`}>{displayLabel}</Label>
          <Textarea
            id={`${section}-${key}`}
            value={value}
            onChange={(e) => handleDataChange(section, key, e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-1 mb-3">
        <Label htmlFor={`${section}-${key}`}>{displayLabel}</Label>
        <Input
          id={`${section}-${key}`}
          value={value !== null ? value.toString() : ''}
          onChange={(e) => handleDataChange(section, key, e.target.value)}
        />
      </div>
    );
  };

  const renderEditableSection = (sectionName: string, sectionData: Record<string, any>) => {
    return (
      <div className="space-y-3 mb-5">
        <h3 className="text-lg font-medium">{sectionName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('_', ' ')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(sectionData).map(([key, value]) => {
            if (typeof value === 'object' && value !== null) return null;
            return (
              <div key={key}>
                {renderEditableField(sectionName, key, value)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExtractedData = () => {
    if (isEditing && document) {
      return (
        <div className="space-y-5 px-1 py-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Extracted Data</h2>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdits}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
          
          {editedData && editedData.structured_data && (
            <div className="space-y-5">
              {editedData.structured_data.patient && (
                renderEditableSection('patient', editedData.structured_data.patient)
              )}
              
              <Separator />
              
              {editedData.structured_data.certification && (
                renderEditableSection('certification', editedData.structured_data.certification)
              )}
              
              <Separator />
              
              {editedData.structured_data.examination_results && (
                renderEditableSection('examination_results', editedData.structured_data.examination_results)
              )}
              
              <Separator />
              
              {editedData.structured_data.medical_details && (
                renderEditableSection('medical_details', editedData.structured_data.medical_details)
              )}
            </div>
          )}
        </div>
      );
    }
    
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
    
    const extractedData = document.extractedData;
    
    if (document.type === 'Certificate of Fitness') {
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
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Raw Extracted Information</h3>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-screen-xl mx-auto py-4 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{document?.name || 'Loading document...'}</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : document ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between bg-muted/50 p-4">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{document.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      Uploaded on {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (document.jsonData) {
                      navigator.clipboard.writeText(document.jsonData);
                      toast.success("JSON data copied to clipboard");
                    }
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Badge className={document.status === 'processed' ? 'bg-green-500' : 'bg-amber-500'}>
                      {document.status === 'processed' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Processed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Processing
                        </>
                      )}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOriginal(!showOriginal)}
                  >
                    {showOriginal ? (
                      <>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Show Extracted
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Original
                      </>
                    )}
                  </Button>
                </div>
                
                {showOriginal ? (
                  <div className="rounded border overflow-hidden h-[calc(100vh-400px)]">
                    {document.status === 'processing' ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">Processing document...</p>
                      </div>
                    ) : !imageUrl ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">Preview not available</p>
                      </div>
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt={document.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 h-[calc(100vh-400px)] overflow-y-auto">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Patient Information</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{document.patientName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID</p>
                          <p className="font-medium">{document.patientId}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold">Extracted Data</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={startValidation}
                        >
                          {isEditing ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Validate Data
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <Tabs defaultValue="structured">
                        <TabsList className="mb-4">
                          <TabsTrigger value="structured">Structured Data</TabsTrigger>
                          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="structured" className="mt-0">
                          <ScrollArea className="h-[calc(100vh-550px)]">
                            {renderExtractedData()}
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="raw" className="mt-0">
                          <ScrollArea className="h-[calc(100vh-550px)]">
                            <div className="p-4 rounded bg-muted">
                              <pre className="text-xs overflow-auto">
                                {document.jsonData}
                              </pre>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between bg-muted/50 p-4">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Document Preview</h3>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4">
                <div className="rounded border overflow-hidden h-[calc(100vh-400px)]">
                  {document.status === 'processing' ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Processing document...</p>
                    </div>
                  ) : !imageUrl ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Preview not available</p>
                    </div>
                  ) : (
                    <img 
                      src={imageUrl} 
                      alt={document.name}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Document not found</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
