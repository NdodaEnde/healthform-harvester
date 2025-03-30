import { useState, useEffect, useRef } from "react";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Download, Copy, Printer, CheckCircle2, Eye, 
  EyeOff, FileText, AlertCircle, ClipboardCheck, Loader2, Clock,
  Check, Pencil, Save, X, Mail
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
import { generatePdfFromElement, generatePdfBlobFromElement, sendCertificateEmail } from "@/lib/pdf";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import DocumentHeader from "@/components/DocumentHeader";

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
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false);
  const certificateRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      try {
        // Simulate fetching document data
        // Replace this with your actual data fetching logic
        // const { data, error } = await supabase
        //   .from('documents')
        //   .select('*')
        //   .eq('id', id)
        //   .single();

        // if (error) {
        //   console.error("Error fetching document:", error);
        //   toast({
        //     title: "Error fetching document",
        //     description: "Failed to load document details.",
        //     variant: "destructive",
        //   });
        //   return;
        // }

        // setDocument(data);
        setDocument(mockDocumentData);

        // Simulate processing delay
        const timeoutId = setTimeout(() => {
          setImageUrl(mockDocumentData.imageUrl);
          setIsLoading(false);
          setValidatorData(mapExtractedDataToValidatorFormat(mockDocumentData.extractedData));
        }, 1500);

        setProcessingTimeout(timeoutId);
      } catch (error) {
        console.error("Failed to load document:", error);
        toast({
          title: "Failed to load document",
          description: "There was an error loading the document.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();

    return () => {
      if (processingTimeout) {
        clearTimeout(processingTimeout);
      }
    };
  }, [id, refreshKey]);

  useEffect(() => {
    if (document) {
      setEditableData(document.extractedData);
    }
  }, [document]);

  const handleRescan = () => {
    toast({
      title: "Rescanning Document",
      description: "The document is being rescanned. Please wait.",
    });
    setIsLoading(true);
    // Simulate rescanning
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Rescan Complete",
        description: "The document has been rescanned.",
      });
      setRefreshKey(prevKey => prevKey + 1);
    }, 2000);
  };

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Validation Complete",
        description: "The document has been validated successfully.",
      });
    } catch (error) {
      console.error("Validation Error:", error);
      toast({
        title: "Validation Error",
        description: "There was an error validating the document.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopyData = () => {
    if (document && document.jsonData) {
      navigator.clipboard.writeText(JSON.stringify(document.jsonData, null, 2))
        .then(() => {
          toast({
            title: "Data Copied",
            description: "JSON data copied to clipboard.",
          });
        })
        .catch(err => {
          console.error("Could not copy text: ", err);
          toast({
            title: "Copy Failed",
            description: "Failed to copy JSON data to clipboard.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "No Data",
        description: "No JSON data available to copy.",
        variant: "destructive",
      });
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveData = async () => {
    setIsLoading(true);
    try {
      // Simulate saving data
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Here you would typically send the updated data to your backend
      console.log("Saving data:", editableData);
      toast({
        title: "Save Successful",
        description: "The document data has been saved.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Save Error:", error);
      toast({
        title: "Save Error",
        description: "There was an error saving the document data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableData(document.extractedData);
    setIsEditing(false);
  };

  const handleDataChange = (tab: string, field: string, value: string) => {
    setEditableData(prevData => ({
      ...prevData,
      [tab]: {
        ...prevData[tab],
        [field]: value,
      },
    }));
  };

  const handleGeneratePdf = async () => {
    if (!certificateRef.current) {
      toast({
        title: "Error",
        description: "Certificate template not found.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingPdf('download');
    try {
      await generatePdfFromElement(certificateRef.current, 'certificate.pdf');
      toast({
        title: "PDF Generated",
        description: "Certificate PDF has been generated and downloaded.",
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate the certificate PDF.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleGeneratePdfBlob = async () => {
    if (!certificateRef.current) {
      toast({
        title: "Error",
        description: "Certificate template not found.",
        variant: "destructive",
      });
      return;
    }
  
    setGeneratingPdf('email');
    try {
      const pdfBlob = await generatePdfBlobFromElement(certificateRef.current);
      // You can now use this blob for sending via email or other purposes
      console.log("PDF Blob generated successfully", pdfBlob);
      toast({
        title: "PDF Blob Generated",
        description: "Certificate PDF blob has been generated.",
      });
    } catch (error) {
      console.error("PDF Blob Generation Error:", error);
      toast({
        title: "PDF Blob Generation Error",
        description: "Failed to generate the certificate PDF blob.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleSendEmail = async () => {
    if (!certificateRef.current) {
      toast({
        title: "Error",
        description: "Certificate template not found.",
        variant: "destructive",
      });
      return;
    }
  
    setSendingEmail(true);
    try {
      const pdfBlob = await generatePdfBlobFromElement(certificateRef.current);
      const result = await sendCertificateEmail(
        emailAddress,
        "Medical Certificate",
        pdfBlob,
        document.patientName,
        document.type
      );
  
      if (result.success) {
        toast({
          title: "Email Sent",
          description: "Certificate has been sent via email.",
        });
      } else {
        toast({
          title: "Email Failed",
          description: result.error || "Failed to send the email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Email Sending Error:", error);
      toast({
        title: "Email Sending Error",
        description: "Failed to send the certificate via email.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
      setShowEmailDialog(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {showEmailDialog && (
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Certificate via Email</DialogTitle>
              <DialogDescription>
                Enter the recipient's email address to send the certificate.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="col-span-3"
                  type="email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSendEmail} disabled={sendingEmail}>
                {sendingEmail ? (
                  <>
                    Sending...
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  "Send Email"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <div className="p-4 flex items-center justify-between border-b">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowOriginal(!showOriginal)}>
            {showOriginal ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Original
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Original
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleRescan} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rescanning...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Rescan
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCopyData}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Data
          </Button>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleEditToggle}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Data
            </Button>
          )}
          <Button onClick={handleGeneratePdf} disabled={generatingPdf !== null}>
            {generatingPdf === 'download' ? (
              <>
                Generating...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowEmailDialog(true)} disabled={generatingPdf === 'email'}>
            {generatingPdf === 'email' ? (
              <>
                Preparing...
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Email Certificate
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden">
        <Tabs defaultValue="personal" className="w-full h-full">
          <TabsList className="w-full flex justify-center">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="examResults">Exam Results</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="certificate">Certificate</TabsTrigger>
          </TabsList>
          <div className="flex flex-grow overflow-hidden">
            <ScrollArea className="w-full h-full">
              <div className="p-4 md:grid md:grid-cols-2 md:gap-4">
                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Personal Information</div>
                      <Separator />
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            type="text"
                            id="fullName"
                            value={editableData?.personal?.fullName || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "fullName", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            type="date"
                            id="dateOfBirth"
                            value={editableData?.personal?.dateOfBirth || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "dateOfBirth", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="gender">Gender</Label>
                          <Input
                            type="text"
                            id="gender"
                            value={editableData?.personal?.gender || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "gender", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employeeId">Employee ID</Label>
                          <Input
                            type="text"
                            id="employeeId"
                            value={editableData?.personal?.employeeId || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "employeeId", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={editableData?.personal?.address || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "address", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            type="tel"
                            id="phoneNumber"
                            value={editableData?.personal?.phoneNumber || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "phoneNumber", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            type="email"
                            id="email"
                            value={editableData?.personal?.email || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "email", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="occupation">Occupation</Label>
                          <Input
                            type="text"
                            id="occupation"
                            value={editableData?.personal?.occupation || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "occupation", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="employer">Employer</Label>
                          <Input
                            type="text"
                            id="employer"
                            value={editableData?.personal?.employer || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("personal", "employer", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Medical Information</div>
                      <Separator />
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="allergies">Allergies</Label>
                          <Input
                            type="text"
                            id="allergies"
                            value={editableData?.medical?.allergies || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "allergies", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="currentMedications">Current Medications</Label>
                          <Textarea
                            id="currentMedications"
                            value={editableData?.medical?.currentMedications || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "currentMedications", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                          <Input
                            type="text"
                            id="chronicConditions"
                            value={editableData?.medical?.chronicConditions || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "chronicConditions", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="previousSurgeries">Previous Surgeries</Label>
                          <Input
                            type="text"
                            id="previousSurgeries"
                            value={editableData?.medical?.previousSurgeries || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "previousSurgeries", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="familyHistory">Family History</Label>
                          <Textarea
                            id="familyHistory"
                            value={editableData?.medical?.familyHistory || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "familyHistory", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="smoker">Smoker</Label>
                          <Input
                            type="text"
                            id="smoker"
                            value={editableData?.medical?.smoker || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "smoker", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="alcoholConsumption">Alcohol Consumption</Label>
                          <Input
                            type="text"
                            id="alcoholConsumption"
                            value={editableData?.medical?.alcoholConsumption || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "alcoholConsumption", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="exerciseFrequency">Exercise Frequency</Label>
                          <Input
                            type="text"
                            id="exerciseFrequency"
                            value={editableData?.medical?.exerciseFrequency || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("medical", "exerciseFrequency", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vitals" className="space-y-4">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Vitals</div>
                      <Separator />
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="height">Height</Label>
                          <Input
                            type="text"
                            id="height"
                            value={editableData?.vitals?.height || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "height", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight">Weight</Label>
                          <Input
                            type="text"
                            id="weight"
                            value={editableData?.vitals?.weight || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "weight", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bmi">BMI</Label>
                          <Input
                            type="text"
                            id="bmi"
                            value={editableData?.vitals?.bmi || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "bmi", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="bloodPressure">Blood Pressure</Label>
                          <Input
                            type="text"
                            id="bloodPressure"
                            value={editableData?.vitals?.bloodPressure || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "bloodPressure", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="heartRate">Heart Rate</Label>
                          <Input
                            type="text"
                            id="heartRate"
                            value={editableData?.vitals?.heartRate || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "heartRate", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                          <Input
                            type="text"
                            id="respiratoryRate"
                            value={editableData?.vitals?.respiratoryRate || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "respiratoryRate", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="temperature">Temperature</Label>
                          <Input
                            type="text"
                            id="temperature"
                            value={editableData?.vitals?.temperature || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "temperature", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="oxygenSaturation">Oxygen Saturation</Label>
                          <Input
                            type="text"
                            id="oxygenSaturation"
                            value={editableData?.vitals?.oxygenSaturation || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("vitals", "oxygenSaturation", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="examResults" className="space-y-4">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Exam Results</div>
                      <Separator />
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="vision">Vision</Label>
                          <Input
                            type="text"
                            id="vision"
                            value={editableData?.examResults?.vision || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("examResults", "vision", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hearing">Hearing</Label>
                          <Input
                            type="text"
                            id="hearing"
                            value={editableData?.examResults?.hearing || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("examResults", "hearing", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lungFunction">Lung Function</Label>
                          <Input
                            type="text"
                            id="lungFunction"
                            value={editableData?.examResults?.lungFunction || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("examResults", "lungFunction", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="chestXRay">Chest X-Ray</Label>
                          <Input
                            type="text"
                            id="chestXRay"
                            value={editableData?.examResults?.chestXRay || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("examResults", "chestXRay", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="laboratory">Laboratory</Label>
                          <Textarea
                            id="laboratory"
                            value={editableData?.examResults?.laboratory || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("examResults", "laboratory", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assessment" className="space-y-4">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Assessment</div>
                      <Separator />
                      <div className="grid gap-2">
                        <div>
                          <Label htmlFor="diagnosis">Diagnosis</Label>
                          <Textarea
                            id="diagnosis"
                            value={editableData?.assessment?.diagnosis || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("assessment", "diagnosis", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="recommendations">Recommendations</Label>
                          <Textarea
                            id="recommendations"
                            value={editableData?.assessment?.recommendations || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("assessment", "recommendations", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="restrictions">Restrictions</Label>
                          <Input
                            type="text"
                            id="restrictions"
                            value={editableData?.assessment?.restrictions || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("assessment", "restrictions", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fitnessConclusion">Fitness Conclusion</Label>
                          <Input
                            type="text"
                            id="fitnessConclusion"
                            value={editableData?.assessment?.fitnessConclusion || ""}
                            disabled={!isEditing}
                            onChange={(e) => handleDataChange("assessment", "fitnessConclusion", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="validation">
                  <Card>
                    <CardContent className="space-y-2">
                      <div className="text-sm font-medium">Validation</div>
                      <Separator />
                      {validatorData ? (
                        <CertificateValidator data={validatorData} isValidating={isValidating} onValidate={handleValidation} />
                      ) : (
                        <div className="text-center">No data to validate.</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certificate">
                  <Card>
                    <CardContent>
                      <div ref={certificateRef} className="print:p-0">
                        <DocumentHeader title="Certificate of Medical Examination" />
                        <CertificateTemplate document={document} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default DocumentViewer;
