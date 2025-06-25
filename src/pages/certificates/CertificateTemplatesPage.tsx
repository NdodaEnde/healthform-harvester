
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { toast } from "@/components/ui/use-toast";
import CertificateTemplateManager from "@/components/certificates/CertificateTemplateManager";
import EnhancedCertificateGenerator from "@/components/certificates/EnhancedCertificateGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractCertificateData } from "@/lib/utils";

// Sample data for the enhanced certificate generator - removed BMI data
const sampleDocument = {
  id: "sample-doc-id",
  file_name: "Sample Certificate.pdf",
  file_path: "sample/path/certificate.pdf",
  status: "processed",
  document_type: "certificate-of-fitness",
  processed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  mime_type: "application/pdf",
  file_size: 1024000,
  public_url: null,
  owner_id: null,
  organization_id: null,
  client_organization_id: null,
  validation_status: "pending",
  processing_error: null,
  user_id: null,
  extracted_data: {
    structured_data: {
      patient: {
        name: "John Smith",
        id_number: "8501015555081",
        company: "Mining Corporation Ltd",
        occupation: "Equipment Operator"
      },
      examination_results: {
        date: "2025-04-01",
        type: {
          pre_employment: false,
          periodical: true,
          exit: false
        },
        test_results: {
          bloods_done: true,
          bloods_results: "Normal",
          far_near_vision_done: true,
          far_near_vision_results: "20/20",
          hearing_done: true,
          hearing_results: "Normal range",
          lung_function_done: true,
          lung_function_results: "85% capacity"
          // Removed BMI-related fields
        }
      },
      certification: {
        fit: true,
        valid_until: "2026-04-01",
        comments: "Patient is in good overall health. No concerns noted during examination.",
        review_date: "2026-04-01"
      },
      restrictions: {
        heights: false,
        dust_exposure: true,
        wear_hearing_protection: true
      }
    }
  }
};

export default function CertificateTemplatesPage() {
  const [activeTab, setActiveTab] = useState("manage");
  
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
      
      <Tabs defaultValue="manage" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate Certificate</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="pt-4">
          <CertificateTemplateManager />
        </TabsContent>
        
        <TabsContent value="generate" className="pt-4">
          <div className="bg-white rounded-lg shadow p-6">
            <EnhancedCertificateGenerator document={sampleDocument} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
