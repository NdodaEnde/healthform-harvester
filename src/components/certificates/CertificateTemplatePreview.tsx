import { useRef, useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, Download, Eye, Loader2 } from "lucide-react";
import { BrandingSettings } from "@/types/organization";
import { toast } from "@/components/ui/use-toast";

interface CertificateTemplatePreviewProps {
  template: {
    id: string;
    name: string;
    template_data: any;
  };
  organizationBranding?: BrandingSettings;
  patientData?: any;
  certificateData?: any;
  onDownloadPdf?: () => void;
  downloadMode?: boolean;
}

export default function CertificateTemplatePreview({
  template,
  organizationBranding,
  patientData,
  certificateData,
  onDownloadPdf,
  downloadMode = false,
}: CertificateTemplatePreviewProps) {
  const { currentOrganization } = useOrganization();
  const previewRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const branding = organizationBranding || {
    primary_color: "#0f172a",
    secondary_color: "#6366f1",
    text_color: "#ffffff"
  };

  const templateData = template.template_data || {
    sections: [],
    branding: { 
      showLogo: true,
      showHeader: true,
      showFooter: true,
      useOrganizationColors: true
    },
    layout: {
      pageSize: "A4",
      orientation: "portrait"
    }
  };

  const patient = patientData || {
    first_name: "Jane",
    last_name: "Doe",
    date_of_birth: "1985-05-15",
    gender: "female",
    id: "mock-patient-id"
  };

  const certificate = certificateData || {
    id: "mock-certificate-id",
    expiration_date: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
    fitness_declaration: {
      issuedBy: "Dr. Smith",
      issuedDate: new Date().toISOString().split('T')[0],
      fitnessLevel: "Fully fit for duty"
    },
    medical_tests: {
      bloodPressure: "120/80",
      heartRate: "72",
      weight: "70kg",
      height: "175cm",
      bmi: "22.9"
    },
    vision_tests: {
      leftEye: "20/20",
      rightEye: "20/20",
      colorVision: "Normal"
    },
    restrictions: ["None"],
    followup_actions: {
      recommendations: ["Annual check-up recommended"]
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setGeneratingPdf(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "PDF Generated Successfully",
        description: "The certificate has been downloaded to your device.",
      });
      
      if (onDownloadPdf) {
        onDownloadPdf();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Failed to generate PDF",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleFullScreen = () => {
    alert("This would show a full screen preview");
  };

  useEffect(() => {
    if (downloadMode) {
      handleDownload();
    }
  }, [downloadMode]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Certificate Preview</h3>
          <p className="text-sm text-muted-foreground">
            Preview how the certificate will look with current template settings
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleFullScreen}>
            <Eye className="mr-2 h-4 w-4" />
            Full Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload} 
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border shadow-md print:shadow-none">
        <div 
          ref={previewRef}
          className={`certificate-preview ${
            templateData.layout.orientation === "landscape" ? "aspect-[1.414/1]" : "aspect-[0.707/1]"
          } bg-white`}
          style={{ maxWidth: "100%", margin: "0 auto" }}
        >
          {templateData.branding.showHeader && (
            <div 
              className="p-6 border-b"
              style={
                templateData.branding.useOrganizationColors
                  ? { backgroundColor: branding.primary_color, color: branding.text_color }
                  : templateData.branding.customColors
                    ? { 
                        backgroundColor: templateData.branding.customColors.headerBackground,
                        color: templateData.branding.customColors.headerText 
                      }
                    : {}
              }
            >
              <div className="flex justify-between items-start">
                {templateData.branding.showLogo && currentOrganization?.logo_url && (
                  <div className="flex-shrink-0">
                    <img 
                      src={currentOrganization.logo_url} 
                      alt={`${currentOrganization.name} logo`}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                )}
                <div className={templateData.branding.showLogo ? "text-right" : "w-full"}>
                  <h1 className="text-2xl font-bold mb-2">Certificate of Medical Fitness</h1>
                  <div className="text-sm">
                    <div className="font-semibold">{currentOrganization?.name || "Organization Name"}</div>
                    {currentOrganization?.contact_email && (
                      <div>{currentOrganization.contact_email}</div>
                    )}
                    {currentOrganization?.contact_phone && (
                      <div>{currentOrganization.contact_phone}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            {templateData.sections.find(s => s.title === "Patient Information")?.enabled && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Patient Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{patient.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            )}

            {templateData.sections.find(s => s.title === "Medical Tests")?.enabled && certificate.medical_tests && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Medical Tests
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Blood Pressure</p>
                    <p className="font-medium">{certificate.medical_tests.bloodPressure}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Heart Rate</p>
                    <p className="font-medium">{certificate.medical_tests.heartRate} bpm</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">BMI</p>
                    <p className="font-medium">{certificate.medical_tests.bmi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium">{certificate.medical_tests.weight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Height</p>
                    <p className="font-medium">{certificate.medical_tests.height}</p>
                  </div>
                </div>
              </div>
            )}

            {templateData.sections.find(s => s.title === "Vision Tests")?.enabled && certificate.vision_tests && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Vision Tests
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Left Eye</p>
                    <p className="font-medium">{certificate.vision_tests.leftEye}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Right Eye</p>
                    <p className="font-medium">{certificate.vision_tests.rightEye}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Color Vision</p>
                    <p className="font-medium">{certificate.vision_tests.colorVision}</p>
                  </div>
                </div>
              </div>
            )}

            {templateData.sections.find(s => s.title === "Fitness Declaration")?.enabled && certificate.fitness_declaration && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Fitness Declaration
                </h2>
                <div className="p-4 border rounded-md bg-gray-50">
                  <p className="font-medium text-center mb-2">
                    {certificate.fitness_declaration.fitnessLevel}
                  </p>
                  <div className="text-sm text-center">
                    <p>This certificate is valid until {new Date(certificate.expiration_date).toLocaleDateString()}</p>
                    <p className="mt-2">Issued by {certificate.fitness_declaration.issuedBy} on {new Date(certificate.fitness_declaration.issuedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            {templateData.sections.find(s => s.title === "Restrictions")?.enabled && certificate.restrictions && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Restrictions
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  {certificate.restrictions.map((restriction: string, index: number) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
              </div>
            )}

            {templateData.sections.find(s => s.title === "Follow-up Actions")?.enabled && certificate.followup_actions && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3"
                  style={
                    templateData.branding.useOrganizationColors
                      ? { color: branding.secondary_color }
                      : templateData.branding.customColors
                        ? { color: templateData.branding.customColors.accentColor }
                        : {}
                  }
                >
                  Follow-up Actions
                </h2>
                <ul className="list-disc pl-5 space-y-1">
                  {certificate.followup_actions.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-12 pt-8 border-t">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="h-16 border-b border-dashed mb-2"></div>
                  <p className="text-sm text-center">Healthcare Provider Signature</p>
                </div>
                <div>
                  <div className="h-16 border-b border-dashed mb-2"></div>
                  <p className="text-sm text-center">Official Stamp</p>
                </div>
              </div>
            </div>
          </div>

          {templateData.branding.showFooter && (
            <div 
              className="p-4 text-center text-sm border-t"
              style={
                templateData.branding.useOrganizationColors
                  ? { 
                      backgroundColor: branding.primary_color, 
                      color: branding.text_color,
                      opacity: 0.9
                    }
                  : templateData.branding.customColors
                    ? { 
                        backgroundColor: templateData.branding.customColors.footerBackground,
                        color: templateData.branding.customColors.footerText 
                      }
                    : {}
              }
            >
              <p>This certificate was issued by {currentOrganization?.name || "Organization Name"}</p>
              <p>Certificate ID: {certificate.id}</p>
            </div>
          )}
        </div>
      </Card>
      
      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-preview, .certificate-preview * {
            visibility: visible;
          }
          .certificate-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
          }
        }
        `}
      </style>
    </div>
  );
}
