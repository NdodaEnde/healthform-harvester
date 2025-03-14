
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
import { associateOrphanedDocuments } from "@/utils/documentOrganizationFixer";
import { AlertTriangle, FileCheck } from "lucide-react";
import { useState } from "react";

export const OrphanedDocumentFixer = () => {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [count, setCount] = useState(0);
  const { currentOrganization } = useOrganization();
  
  const handleFixOrphanedDocuments = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    try {
      const result = await associateOrphanedDocuments(currentOrganization.id);
      setFixed(result.success);
      setCount(result.count || 0);
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
          Orphaned Documents Detected
        </CardTitle>
        <CardDescription>
          Some documents in your system are not associated with any organization,
          which may cause them to be inaccessible due to security policies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          These are documents that were uploaded before your organization context was created.
          Associating them with your current organization will make them visible and protected
          by the correct security policies.
        </p>
        
        {fixed && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5" />
            <span className="text-sm font-medium">
              Success! {count} documents have been associated with {currentOrganization.name}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleFixOrphanedDocuments} 
          disabled={loading || fixed}
        >
          {loading ? "Processing..." : fixed ? "Documents Fixed" : "Associate Orphaned Documents"}
        </Button>
      </CardFooter>
    </Card>
  );
};
