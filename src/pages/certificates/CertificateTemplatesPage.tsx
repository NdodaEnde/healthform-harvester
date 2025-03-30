
import React from "react";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";
import CertificateTemplateManager from "@/components/certificates/CertificateTemplateManager";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CertificateTemplatesPage() {
  const navigate = useNavigate();
  
  const handleManageTemplates = () => {
    // This is already the current page, but included for completeness
    toast({
      title: "Template Management",
      description: "You can create and edit certificate templates here."
    });
  };
  
  const handleGenerateCertificate = () => {
    // Navigate to patient selection page
    toast({
      title: "Generate Certificate",
      description: "Select a patient to generate a certificate."
    });
    navigate('/patients');
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Certificate Templates | Medical Certificates</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Templates</h1>
          <p className="text-muted-foreground">
            Create and manage templates for medical certificates
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManageTemplates}>
            <FileText className="mr-2 h-4 w-4" />
            Manage Templates
          </Button>
          <Button onClick={handleGenerateCertificate}>
            <Download className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        </div>
      </div>
      
      <CertificateTemplateManager />
    </div>
  );
}
