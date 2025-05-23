
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
import { AlertTriangle, FileCheck, Link } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const OrphanedDocumentFixer = () => {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [count, setCount] = useState(0);
  const [standardizeBucket, setStandardizeBucket] = useState<string>("medical-documents");
  const [shouldStandardize, setShouldStandardize] = useState(true);
  const { currentOrganization } = useOrganization();
  
  const handleFixOrphanedDocuments = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      // First associate orphaned documents
      const result = await associateOrphanedDocuments(currentOrganization.id);
      let totalCount = 0;
      let totalMigrated = 0;
      let urlResult = { success: false, count: 0 };
      let standardizeResult = { success: false, count: 0 };
      
      // Then fix URLs for documents that need it
      if (result.success) {
        urlResult = await fixDocumentUrls(
          currentOrganization.id, 
          shouldStandardize ? standardizeBucket : undefined
        );
        
        // If standardization is requested, reorganize files into proper structure
        if (shouldStandardize) {
          standardizeResult = await standardizeDocumentStorage(
            currentOrganization.id,
            standardizeBucket
          );
          
          totalMigrated = standardizeResult.count || 0;
        }
        
        totalCount = (result.count || 0) + (urlResult.count || 0);
        setFixed(result.success || urlResult.success || standardizeResult.success);
        setCount(totalCount);
      } else {
        setFixed(result.success);
        setCount(result.count || 0);
        totalCount = result.count || 0;
      }
      
      if (totalCount > 0) {
        let message = `Fixed ${totalCount} documents`;
        if (totalMigrated > 0) {
          message += ` and reorganized ${totalMigrated} documents into standardized folders`;
        }
        toast.success(message);
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
          Fix document organization associations, URLs, and standardize storage to ensure all documents
          are properly organized and accessible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This tool fixes several common document issues and can standardize your document storage for improved organization.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="standardize" 
              checked={shouldStandardize}
              onCheckedChange={(checked) => setShouldStandardize(checked === true)}
            />
            <Label htmlFor="standardize">
              Standardize document storage (recommended)
            </Label>
          </div>
          
          {shouldStandardize && (
            <div>
              <Label htmlFor="bucket-select" className="mb-2 block">
                Storage bucket for all documents:
              </Label>
              <Select
                value={standardizeBucket}
                onValueChange={setStandardizeBucket}
              >
                <SelectTrigger id="bucket-select" className="w-full">
                  <SelectValue placeholder="Select bucket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical-documents">medical-documents (Recommended)</SelectItem>
                  <SelectItem value="documents">documents</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This will copy files between buckets as needed and organize them into a structured folder system.
              </p>
            </div>
          )}
        </div>
        
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
