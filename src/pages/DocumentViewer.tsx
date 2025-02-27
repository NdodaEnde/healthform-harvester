
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Mock document data (would be fetched from API based on ID in real app)
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

  useEffect(() => {
    // In a real app, this would be a fetch request to get the document data
    setIsLoading(true);
    setTimeout(() => {
      setDocument(mockDocumentData);
      setIsLoading(false);
    }, 1000);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
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
              {document.type} | {document.patientName}
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
                toast.success("Document printed successfully");
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
          {/* Original Document Panel */}
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
                <Badge variant="outline" className="text-xs">PDF</Badge>
              </div>
              <Card className="overflow-hidden h-[calc(100vh-220px)]">
                <div className="relative w-full h-full">
                  <img 
                    src={document.imageUrl} 
                    alt="Document preview" 
                    className="w-full h-full object-contain"
                  />
                  {/* In a real app, you would show the actual document with bounding boxes */}
                  <div className="absolute inset-0 p-4 text-center flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
                      <p className="text-muted-foreground">
                        In a real application, this would display the original document with 
                        bounding boxes highlighting extracted data.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* Extracted Data Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex flex-col space-y-4 ${showOriginal ? "" : "lg:col-span-2 md:w-3/4 mx-auto"}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Extracted Data</h2>
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Processed
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
                
                <CardContent className="pt-4 h-[calc(100vh-270px)]">
                  <TabsContent value="structured" className="m-0">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-3">Personal Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Full Name</p>
                              <p className="font-medium">{document.extractedData.personal.fullName}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Date of Birth</p>
                              <p className="font-medium">{document.extractedData.personal.dateOfBirth}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Gender</p>
                              <p className="font-medium">{document.extractedData.personal.gender}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Employee ID</p>
                              <p className="font-medium">{document.extractedData.personal.employeeId}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{document.extractedData.personal.address}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Phone Number</p>
                              <p className="font-medium">{document.extractedData.personal.phoneNumber}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{document.extractedData.personal.email}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Occupation</p>
                              <p className="font-medium">{document.extractedData.personal.occupation}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Employer</p>
                              <p className="font-medium">{document.extractedData.personal.employer}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Medical History</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Allergies</p>
                              <p className="font-medium">{document.extractedData.medical.allergies}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Current Medications</p>
                              <p className="font-medium">{document.extractedData.medical.currentMedications}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                              <p className="font-medium">{document.extractedData.medical.chronicConditions}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Previous Surgeries</p>
                              <p className="font-medium">{document.extractedData.medical.previousSurgeries}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Family History</p>
                              <p className="font-medium">{document.extractedData.medical.familyHistory}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Smoker</p>
                              <p className="font-medium">{document.extractedData.medical.smoker}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Alcohol Consumption</p>
                              <p className="font-medium">{document.extractedData.medical.alcoholConsumption}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Exercise Frequency</p>
                              <p className="font-medium">{document.extractedData.medical.exerciseFrequency}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Vital Signs</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Height</p>
                              <p className="font-medium">{document.extractedData.vitals.height}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Weight</p>
                              <p className="font-medium">{document.extractedData.vitals.weight}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">BMI</p>
                              <p className="font-medium">{document.extractedData.vitals.bmi}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Blood Pressure</p>
                              <p className="font-medium">{document.extractedData.vitals.bloodPressure}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Heart Rate</p>
                              <p className="font-medium">{document.extractedData.vitals.heartRate}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Respiratory Rate</p>
                              <p className="font-medium">{document.extractedData.vitals.respiratoryRate}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Temperature</p>
                              <p className="font-medium">{document.extractedData.vitals.temperature}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Oxygen Saturation</p>
                              <p className="font-medium">{document.extractedData.vitals.oxygenSaturation}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Examination Results</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Vision</p>
                              <p className="font-medium">{document.extractedData.examResults.vision}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Hearing</p>
                              <p className="font-medium">{document.extractedData.examResults.hearing}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Lung Function</p>
                              <p className="font-medium">{document.extractedData.examResults.lungFunction}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Chest X-Ray</p>
                              <p className="font-medium">{document.extractedData.examResults.chestXRay}</p>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1">
                              <p className="text-sm text-muted-foreground">Laboratory Results</p>
                              <p className="font-medium">{document.extractedData.examResults.laboratory}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Assessment</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Diagnosis</p>
                              <p className="font-medium">{document.extractedData.assessment.diagnosis}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Recommendations</p>
                              <p className="font-medium">{document.extractedData.assessment.recommendations}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Restrictions</p>
                              <p className="font-medium">{document.extractedData.assessment.restrictions}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Fitness Conclusion</p>
                              <p className="font-medium">{document.extractedData.assessment.fitnessConclusion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="json" className="m-0">
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
