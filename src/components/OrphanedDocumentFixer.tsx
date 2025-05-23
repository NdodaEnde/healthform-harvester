
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
import { associateOrphanedDocuments, fixDocumentUrls } from "@/utils/documentOrganizationFixer";
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
  const [standardizeBucket, setStandardizeBucket] = useState<string | undefined>(undefined);
  const [shouldStandardize, setShouldStandardize] = useState(false);
  const { currentOrganization } = useOrganization();
  
  const handleFixOrphanedDocuments = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      // First associate orphaned documents
      const result = await associateOrphanedDocuments(currentOrganization.id);
      let totalCount = 0;
      let urlResult = { success: false, count: 0 };
      
      // Then fix URLs for documents that need it
      if (result.success) {
        urlResult = await fixDocumentUrls(
          currentOrganization.id, 
          shouldStandardize ? standardizeBucket : undefined
        );
        totalCount = (result.count || 0) + (urlResult.count || 0);
        setFixed(result.success || urlResult.success);
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
          Fix document organization associations and URLs to ensure all documents are visible
          in the correct context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Some documents may not be associated with your organization or may have incorrect URLs.
          This tool will fix both issues to ensure all your documents are properly accessible.
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
                Select storage bucket for all documents:
              </Label>
              <Select
                value={standardizeBucket || 'medical-documents'}
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
                This will copy files between buckets as needed to standardize your storage.
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
          {loading ? "Processing..." : fixed ? "Documents Fixed" : "Fix Document Associations"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrphanedDocumentFixer;
