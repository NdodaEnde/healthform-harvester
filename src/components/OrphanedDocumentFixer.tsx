
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
  associateOrphanedDocuments, 
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
  
  const handleFixOrphanedDocuments = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      // First associate orphaned documents
      const result = await associateOrphanedDocuments(currentOrganization.id);
      
      // Then fix URLs for documents that need it and standardize paths
      let totalCount = 0;
      
      if (result.success) {
        // Fix document URLs and standardize to medical-documents bucket
        const standardizeResult = await standardizeDocumentStorage(
          currentOrganization.id,
          'medical-documents'
        );
        
        // Update URLs for any remaining documents
        const urlResult = await fixDocumentUrls(
          currentOrganization.id, 
          'medical-documents'
        );
        
        totalCount = (result.count || 0) + (urlResult.count || 0) + (standardizeResult.count || 0);
        setFixed(result.success || urlResult.success || standardizeResult.success);
        setCount(totalCount);
      } else {
        setFixed(result.success);
        setCount(result.count || 0);
        totalCount = result.count || 0;
      }
      
      if (totalCount > 0) {
        toast.success(`Fixed ${totalCount} documents`);
      } else {
        toast.info("No documents needed fixing");
      }
    } catch (error) {
      console.error("Error fixing documents:", error);
      toast.error("Failed to fix documents");
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
          Fix document organization and standardize storage to ensure all documents are properly accessible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This utility fixes orphaned documents, updates document URLs, and standardizes document storage using the medical-documents bucket.
        </p>
        
        {fixed && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 mt-4">
            <FileCheck className="h-5 w-5" />
            <span className="text-sm font-medium">
              Success! {count} documents have been processed for {currentOrganization.name}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleFixOrphanedDocuments} 
          disabled={loading}
        >
          {loading ? "Processing..." : fixed ? "Documents Fixed" : "Fix and Standardize Documents"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrphanedDocumentFixer;
