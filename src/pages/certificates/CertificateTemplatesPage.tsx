
import React from "react";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";
import CertificateTemplateManager from "@/components/certificates/CertificateTemplateManager";

export default function CertificateTemplatesPage() {
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
      </div>
      
      <CertificateTemplateManager />
    </div>
  );
}
