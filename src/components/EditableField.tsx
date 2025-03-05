
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, AlertTriangle, Edit, Check, X } from "lucide-react";
import { calculateConfidence, getConfidenceLevel, getConfidenceClass, cleanExtractedValue } from "@/lib/document-utils";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  fieldType?: 'text' | 'date' | 'name' | 'id' | 'boolean' | 'signature';
  onSave: (newValue: string) => void;
  className?: string;
}

const EditableField = ({ 
  label, 
  value = "", 
  fieldType = 'text', 
  onSave,
  className 
}: EditableFieldProps) => {
  // Clean value first to remove any unwanted elements like signature placeholders
  const cleanedValue = cleanExtractedValue(value);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(cleanedValue);
  
  // Calculate confidence score
  const confidenceScore = calculateConfidence(cleanedValue, fieldType);
  const confidenceLevel = getConfidenceLevel(confidenceScore);
  const confidenceClass = getConfidenceClass(confidenceScore);
  
  const handleSave = () => {
    onSave(editedValue);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedValue(cleanedValue);
    setIsEditing(false);
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        
        <div className="flex items-center space-x-1">
          {confidenceLevel === 'high' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {confidenceLevel === 'medium' && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          {confidenceLevel === 'low' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="sr-only">Edit {label}</span>
            </Button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="flex space-x-2">
          <Input
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            className="h-8"
          />
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-2" 
              onClick={handleSave}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-2" 
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn("font-medium p-2 rounded border", confidenceClass)}>
          {cleanedValue || "N/A"}
        </p>
      )}
    </div>
  );
};

export default EditableField;
