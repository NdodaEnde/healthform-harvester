import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EditableField from "./EditableField";
import { CheckCircle2, AlertTriangle, AlertCircle, Save, Edit, Eye } from "lucide-react";

interface CertificateEditorProps {
  documentId: string;
  extractedData: any;
  onSave: (updatedData: any) => void;
  isEditMode?: boolean; // New prop to control if we start in edit mode
}

const CertificateEditor = ({ 
  documentId, 
  extractedData, 
  onSave,
  isEditMode = false // Default to view mode (false) 
}: CertificateEditorProps) => {
  // Initialize editedData with extractedData when component mounts or extractedData changes
  const [editedData, setEditedData] = useState(extractedData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode); // Control edit mode locally
  
  // Update editedData whenever extractedData changes or is loaded
  useEffect(() => {
    if (extractedData) {
      setEditedData(extractedData);
    }
  }, [extractedData]);
  
  if (!extractedData || !extractedData.structured_data) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No structured data available</p>
      </Card>
    );
  }
  
  const structuredData = editedData.structured_data || {};
  
  const handleFieldUpdate = (section: string, subSection: string | null, field: string, value: string) => {
    setEditedData(prev => {
      const updated = { ...prev };
      
      if (!updated.structured_data) {
        updated.structured_data = {};
      }
      
      if (!updated.structured_data[section]) {
        updated.structured_data[section] = {};
      }
      
      if (subSection) {
        if (!updated.structured_data[section][subSection]) {
          updated.structured_data[section][subSection] = {};
        }
        
        updated.structured_data[section][subSection][field] = value;
      } else {
        updated.structured_data[section][field] = value;
      }
      
      return updated;
    });
  };
  
  const saveChanges = async () => {
    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({
          extracted_data: editedData
        })
        .eq('id', documentId)
        .select();
      
      if (error) {
        toast.error("Failed to save changes", {
          description: error.message
        });
        console.error("Save error:", error);
      } else {
        toast.success("Changes saved successfully");
        onSave(editedData);
        // Switch back to view mode after saving
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle between edit and view mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {isEditing ? "Edit Extracted Data" : "Certificate Data"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Review and correct any extraction errors" : "View extracted certificate data"}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {isEditing ? (
            <>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">High confidence</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Medium confidence</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Low confidence</span>
              </div>
            </>
          ) : null}
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            className="space-x-2"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" />
                <span>View Mode</span>
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                <span>Edit Mode</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="patient">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="patient">Patient</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patient" className="p-4 border rounded-md mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditableField 
              label="Name" 
              value={structuredData.patient?.name} 
              fieldType="name"
              onSave={(value) => handleFieldUpdate('patient', null, 'name', value)} 
              isEditMode={isEditing}
            />
            <EditableField 
              label="ID Number" 
              value={structuredData.patient?.employee_id || structuredData.patient?.id_number} 
              fieldType="id"
              onSave={(value) => handleFieldUpdate('patient', null, 'employee_id', value)} 
              isEditMode={isEditing}
            />
            <EditableField 
              label="Company" 
              value={structuredData.patient?.company} 
              onSave={(value) => handleFieldUpdate('patient', null, 'company', value)} 
              isEditMode={isEditing}
            />
            <EditableField 
              label="Occupation" 
              value={structuredData.patient?.occupation} 
              onSave={(value) => handleFieldUpdate('patient', null, 'occupation', value)} 
              isEditMode={isEditing}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="examination" className="p-4 border rounded-md mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField 
                label="Examination Date" 
                value={structuredData.examination_results?.date} 
                fieldType="date"
                onSave={(value) => handleFieldUpdate('examination_results', null, 'date', value)} 
                isEditMode={isEditing}
              />
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Examination Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {structuredData.examination_results?.type && Object.entries(structuredData.examination_results.type).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`exam-type-${key}`} 
                        checked={!!value}
                        onChange={(e) => handleFieldUpdate('examination_results', 'type', key, e.target.checked ? 'true' : 'false')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`exam-type-${key}`} className="text-sm">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Examination Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {structuredData.examination_results?.type && Object.entries(structuredData.examination_results.type)
                    .filter(([_, value]) => !!value)
                    .map(([key]) => (
                      <div key={key} className="text-sm border p-2 rounded-md bg-muted">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Medical Tests</h4>
              <div className="space-y-4">
                {structuredData.examination_results?.test_results && 
                  Object.entries(structuredData.examination_results.test_results)
                    .filter(([key]) => key.endsWith('_done'))
                    .map(([key, value]) => {
                      const baseKey = key.replace('_done', '');
                      const resultKey = `${baseKey}_results`;
                      const testName = baseKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const resultValue = structuredData.examination_results.test_results[resultKey];
                      
                      if (isEditing) {
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input 
                                type="checkbox" 
                                id={`test-${key}`} 
                                checked={!!value}
                                onChange={(e) => handleFieldUpdate('examination_results', 'test_results', key, e.target.checked ? 'true' : 'false')}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor={`test-${key}`} className="text-sm font-medium">
                                {testName}
                              </label>
                            </div>
                            
                            {value && (
                              <EditableField 
                                label={`${testName} Results`} 
                                value={resultValue} 
                                onSave={(value) => handleFieldUpdate('examination_results', 'test_results', resultKey, value)} 
                                className="pl-6"
                                isEditMode={isEditing}
                              />
                            )}
                          </div>
                        );
                      } else {
                        // Only show tests that were done (value is true)
                        return value ? (
                          <div key={key} className="space-y-1">
                            <p className="text-sm font-medium">{testName}</p>
                            <p className="pl-4 text-sm">{resultValue || "No results recorded"}</p>
                          </div>
                        ) : null;
                      }
                    })
                }
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="certification" className="p-4 border rounded-md mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField 
                label="Valid Until" 
                value={structuredData.certification?.valid_until} 
                fieldType="date"
                onSave={(value) => handleFieldUpdate('certification', null, 'valid_until', value)} 
                isEditMode={isEditing}
              />
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fitness Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {structuredData.certification && Object.entries(structuredData.certification)
                    .filter(([key]) => typeof key === 'string' && typeof structuredData.certification[key] === 'boolean')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`cert-${key}`} 
                          checked={!!value}
                          onChange={(e) => handleFieldUpdate('certification', null, key, e.target.checked ? 'true' : 'false')}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`cert-${key}`} className="text-sm">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fitness Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {structuredData.certification && Object.entries(structuredData.certification)
                    .filter(([key, value]) => typeof key === 'string' && typeof value === 'boolean' && !!value)
                    .map(([key]) => (
                      <div key={key} className="text-sm border p-2 rounded-md bg-muted">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <EditableField 
                label="Comments" 
                value={structuredData.certification?.comments} 
                onSave={(value) => handleFieldUpdate('certification', null, 'comments', value)} 
                isEditMode={isEditing}
              />
              
              <EditableField 
                label="Follow Up" 
                value={structuredData.certification?.follow_up} 
                onSave={(value) => handleFieldUpdate('certification', null, 'follow_up', value)} 
                isEditMode={isEditing}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="restrictions" className="p-4 border rounded-md mt-4">
          <div className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structuredData.restrictions && Object.entries(structuredData.restrictions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`restriction-${key}`} 
                      checked={!!value}
                      onChange={(e) => handleFieldUpdate('restrictions', null, key, e.target.checked ? 'true' : 'false')}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`restriction-${key}`} className="text-sm">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {structuredData.restrictions && Object.entries(structuredData.restrictions)
                  .filter(([_, value]) => !!value)
                  .map(([key]) => (
                    <div key={key} className="text-sm border p-2 rounded-md bg-muted">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {isEditing && (
        <div className="flex justify-end">
          <Button 
            onClick={saveChanges} 
            disabled={isSaving}
            className="space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CertificateEditor;
