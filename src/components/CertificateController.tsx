import React, { useState, useEffect } from "react";
import CertificateEditor from "./CertificateEditor";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface CertificateControllerProps {
  documentId: string;
  extractedData: any;
  onSave: (updatedData: any) => void;
  isEditing?: boolean; 
  onEditToggle?: (isEditing: boolean) => void;
}

const CertificateController = ({ 
  documentId, 
  extractedData, 
  onSave,
  isEditing = false,
  onEditToggle
}: CertificateControllerProps) => {
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);
  
  useEffect(() => {
    if (onEditToggle) {
      setLocalIsEditing(isEditing);
    }
  }, [isEditing, onEditToggle]);
  
  const handleEditClick = () => {
    const newEditingState = !localIsEditing;
    setLocalIsEditing(newEditingState);
    
    if (onEditToggle) {
      onEditToggle(newEditingState);
    }
  };
  
  const handleSaveChanges = (editedData: any) => {
    onSave(editedData);
    setLocalIsEditing(false);
    
    if (onEditToggle) {
      onEditToggle(false);
    }
  };
  
  if (!extractedData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No certificate data available</p>
      </Card>
    );
  }
  
  if (localIsEditing) {
    return (
      <CertificateEditor
        documentId={documentId}
        extractedData={extractedData}
        onSave={handleSaveChanges}
      />
    );
  }
  
  return (
    <div className="relative">
      <Button 
        onClick={handleEditClick}
        className="absolute top-2 right-2 bg-blue-600 text-white hover:bg-blue-700 z-10"
      >
        <Edit className="h-4 w-4 mr-1" /> Edit
      </Button>
      
      <Card className="p-6">
        <ScrollArea className="h-[calc(100vh-250px)]">
          <ViewCertificate data={extractedData} />
        </ScrollArea>
      </Card>
    </div>
  );
};

const ViewCertificate = ({ data }: { data: any }) => {
  const getValue = (obj: any, path: string, defaultValue: string = 'N/A') => {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    if (current === undefined || current === null) {
      return defaultValue;
    }
    
    if (typeof current === 'boolean') {
      return current ? 'Yes' : 'No';
    }
    
    return current.toString();
  };

  const structuredData = data.structured_data || data;
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || {};
  const certification = structuredData.certification || {};
  const restrictions = structuredData.restrictions || {};
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium p-2 rounded border">{getValue(patient, 'name')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ID Number</p>
            <p className="font-medium p-2 rounded border">{getValue(patient, 'id_number') || getValue(patient, 'employee_id')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium p-2 rounded border">{getValue(patient, 'company')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Occupation</p>
            <p className="font-medium p-2 rounded border">{getValue(patient, 'occupation')}</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-3">Examination Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Examination Date</p>
            <p className="font-medium p-2 rounded border">{getValue(examination, 'date')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium p-2 rounded border">
              {examination.type && Object.entries(examination.type)
                .filter(([_, value]) => value)
                .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                .join(', ') || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-3">Certification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valid Until</p>
            <p className="font-medium p-2 rounded border">{getValue(certification, 'valid_until')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Fitness Status</p>
            <p className="font-medium p-2 rounded border">
              {certification && Object.entries(certification)
                .filter(([key, value]) => typeof value === 'boolean' && value)
                .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                .join(', ') || 'N/A'}
            </p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-sm text-muted-foreground">Comments</p>
            <p className="font-medium p-2 rounded border">{getValue(certification, 'comments')}</p>
          </div>
          <div className="space-y-1 col-span-2">
            <p className="text-sm text-muted-foreground">Follow Up</p>
            <p className="font-medium p-2 rounded border">{getValue(certification, 'follow_up')}</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium mb-3">Restrictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restrictions && Object.entries(restrictions).length > 0 ? (
            Object.entries(restrictions)
              .filter(([_, value]) => value)
              .map(([key]) => (
                <div key={key} className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              ))
          ) : (
            <p className="text-muted-foreground">No restrictions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateController;
