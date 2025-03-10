<lov-code>
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock,
  Check, Edit, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [editableData, setEditableData] = useState<any>(null);

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

  useEffect(() => {
    if (document && document.extractedData) {
      const formattedData = mapExtractedDataToValidatorFormat(document.extractedData) as unknown as Record<string, any>;
      setEditableData(JSON.parse(JSON.stringify(formattedData)));
    }
  }, [document]);

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

  const updateEditableData = (path: string, value: any) => {
    setEditableData((prevData: any) => {
      const newData = { ...prevData };
      
      const parts = path.split('.');
      let current = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      const lastPart = parts[parts.length - 1];
      current[lastPart] = value;
      
      return newData;
    });
  };

  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Saving edited data:', editableData);
      
      const processedData = editableData as unknown as Json;
      
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
      
      toast.success("Changes saved successfully", {
        description: "Your edits have been saved."
      });
    } catch (error) {
      console.error('Exception saving edited data:', error);
      toast.error("Failed to save changes", {
        description: "There was an error processing your edits."
      });
    }
  };

  const renderEditForm = () => {
    if (!editableData || !editableData.structured_data) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data available to edit</p>
        </div>
      );
    }

    const data = editableData.structured_data;
    
    return (
      <form onSubmit={handleSaveEdits} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient-name">Name</Label>
              <Input 
                id="patient-name" 
                value={data.patient?.name || ''}
                onChange={(e) => updateEditableData('structured_data.patient.name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-id">ID Number</Label>
              <Input 
                id="patient-id" 
                value={data.patient?.id_number || ''}
                onChange={(e) => updateEditableData('structured_data.patient.id_number', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-company">Company</Label>
              <Input 
                id="patient-company" 
                value={data.patient?.company || ''}
                onChange={(e) => updateEditableData('structured_data.patient.company', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-occupation">Occupation</Label>
              <Input 
                id="patient-occupation" 
                value={data.patient?.occupation || ''}
                onChange={(e) => updateEditableData('structured_data.patient.occupation', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Certification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cert-date">Examination Date</Label>
              <Input 
                id="cert-date" 
                value={data.certification?.examination_date || ''}
                onChange={(e) => updateEditableData('structured_data.certification.examination_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-valid">Valid Until</Label>
              <Input 
                id="cert-valid" 
                value={data.certification?.valid_until || ''}
                onChange={(e) => updateEditableData('structured_data.certification.valid_until', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-review">Review Date</Label>
              <Input 
                id="cert-review" 
                value={data.certification?.review_date || ''}
                onChange={(e) => updateEditableData('structured_data.certification.review_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-followup">Follow Up</Label>
              <Input 
                id="cert-followup" 
                value={data.certification?.follow_up || ''}
                onChange={(e) => updateEditableData('structured_data.certification.follow_up', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cert-comments">Comments</Label>
            <Input 
              id="cert-comments" 
              value={data.certification?.comments || ''}
              onChange={(e) => updateEditableData('structured_data.certification.comments', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cert-fit" 
                checked={data.certification?.fit || false}
                onCheckedChange={(checked) => 
                  updateEditableData('structured_data.certification.fit', checked === true)
                }
              />
              <Label htmlFor="cert-fit" className="cursor-pointer">Fit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cert-fit-restrictions" 
                checked={data.certification?.fit_with_restrictions || false}
                onCheckedChange={(checked) => 
                  updateEditableData('structured_data.certification.fit_with_restrictions', checked === true)
                }
              />
              <Label htmlFor="cert-fit-restrictions" className="cursor-pointer">Fit with Restrictions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cert-fit-condition" 
                checked={data.certification?.fit_with_condition || false}
                onCheckedChange={(checked) => 
                  updateEditableData('structured_data.certification.fit_with_condition', checked === true)
                }
              />
              <Label htmlFor="cert-fit-condition" className="cursor-pointer">Fit with Condition</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cert-temp-unfit" 
                checked={data.certification?.temporarily_unfit || false}
                onCheckedChange={(checked) => 
                  updateEditableData('structured_data.certification.temporarily_unfit', checked === true)
                }
              />
              <Label htmlFor="cert-temp-unfit" className="cursor-pointer">Temporarily Unfit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="cert-unfit" 
                checked={data.certification?.unfit || false}
                onCheckedChange={(checked) => 
                  updateEditableData('structured_data.certification.unfit', checked === true)
                }
              />
              <Label htmlFor="cert-unfit" className="cursor-pointer">Unfit</Label>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Examination Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam-date">Date</Label>
              <Input 
                id="exam-date" 
                value={data.examination_results?.date || ''}
                onChange={(e) => updateEditableData('structured_data.examination_results.date', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-md font-medium">Examination Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exam-pre-employment" 
                  checked={data.examination_results?.type?.pre_employment || false}
                  onCheckedChange={(checked) => 
                    updateEditableData('structured_data.examination_results.type.pre_employment', checked === true)
                  }
                />
                <Label htmlFor="exam-pre-employment" className="cursor-pointer">Pre-Employment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exam-periodical" 
                  checked={data.examination_results?.type?.periodical || false}
                  onCheckedChange={(checked) => 
                    updateEditableData('structured_data.examination_results.type.periodical', checked === true)
                  }
                />
                <Label htmlFor="exam-periodical" className="cursor-pointer">Periodical</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exam-exit" 
                  checked={data.examination_results?.type?.exit || false}
                  onCheckedChange={(checked) => 
                    updateEditableData('structured_data.examination_results.type.exit', checked === true)
                  }
                />
                <Label htmlFor="exam-exit" className="cursor-pointer">Exit</Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-md font-medium">Test Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-3 rounded-md space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="test-bloods" 
                    checked={data.examination_results?.test_results?.bloods_done || false}
                    onCheckedChange={(checked) => 
                      updateEditableData('structured_data.examination_results.test_results.bloods_done', checked === true)
                    }
                  />
                  <Label htmlFor="test-bloods" className="cursor-pointer">Blood Test Done</Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="test-bloods-results">Results</Label>
                  <Input 
                    id="test-bloods-results" 
                    value={data.examination_results?.test_results?.bloods_results || ''}
                    onChange={(e) => updateEditableData('structured_data.examination_results.test_results.bloods_results', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="border p-3 rounded-md space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="test-vision" 
                    checked={data.examination_results?.test_results?.far_near_vision_done || false}
                    onCheckedChange={(checked) => 
                      updateEditableData('structured_data.examination_results.test_results.far_near_vision_done', checked === true)
                    }
                  />
                  <Label htmlFor="test-vision" className="cursor-pointer">Far/Near Vision Test Done</Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="test-vision-results">Results</Label>
