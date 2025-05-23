
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  fixDocumentUrls, 
  standardizeDocumentStorage
} from "@/utils/documentOrganizationFixer";
import { AlertTriangle, FileCheck } from "lucide-react";
import { toast } from "sonner";

export const OrphanedDocumentFixer = () => {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [count, setCount] = useState(0);
  const { currentOrganization } = useOrganization();
  
  const handleStandardizeDocuments = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      let totalCount = 0;
      
      // Standardize document storage to medical-documents bucket
      const standardizeResult = await standardizeDocumentStorage(
        currentOrganization.id,
        'medical-documents'
      );
      
      // Update URLs for any documents
      const urlResult = await fixDocumentUrls(
        currentOrganization.id, 
        'medical-documents'
      );
      
      totalCount = (standardizeResult.count || 0) + (urlResult.count || 0);
      setFixed(standardizeResult.success || urlResult.success);
      setCount(totalCount);
      
      if (totalCount > 0) {
        toast.success(`Standardized ${totalCount} documents`);
      } else {
        toast.info("No documents needed standardization");
      }
    } catch (error) {
      console.error("Error standardizing documents:", error);
      toast.error("Failed to standardize documents");
    } finally {
      setLoading(false);
    }
  };
  
  if (!currentOrganization) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Document Management
        </CardTitle>
        <CardDescription>
          Standardize document storage to ensure all documents are properly accessible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This utility standardizes document storage using the medical-documents bucket with a consistent folder structure.
        </p>
        
        {fixed && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 mt-4">
            <FileCheck className="h-5 w-5" />
            <span className="text-sm font-medium">
              Success! {count} documents have been standardized for {currentOrganization.name}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleStandardizeDocuments} 
          disabled={loading}
        >
          {loading ? "Processing..." : fixed ? "Documents Standardized" : "Standardize Documents"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrphanedDocumentFixer;
