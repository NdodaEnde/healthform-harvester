import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CertificateValidatorProps {
  documentId: string;
  extractedData: any;
  onSave: (validatedData: any) => void;
  onCancel: () => void;
}

const CertificateValidator = ({
  documentId,
  extractedData,
  onSave,
  onCancel,
}: CertificateValidatorProps) => {
  const [validatedData, setValidatedData] = useState(() => {
    return JSON.parse(JSON.stringify(extractedData || {}));
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const getConfidenceLevel = (value: any): "high" | "medium" | "low" => {
    if (!value) return "low";
    if (typeof value === "string") {
      if (value.includes("N/A") || value.includes("n/a") || value === "[]" || value === "<td>[ ]</td>") return "medium";
      if (value.length < 2) return "low";
      return "high";
    }
    return "medium";
  };

  const getConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><HelpCircle className="h-3 w-3" /> Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Low</Badge>;
      default:
        return null;
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setValidatedData(prev => {
      const updated = { ...prev };
      if (!updated.structured_data) {
        updated.structured_data = {};
      }
      
      if (!updated.structured_data[section]) {
        updated.structured_data[section] = {};
      }
      
      updated.structured_data[section][field] = value;
      return updated;
    });
  };

  const updateCheckboxField = (section: string, field: string, checked: boolean) => {
    setValidatedData(prev => {
      const updated = { ...prev };
      if (!updated.structured_data) {
        updated.structured_data = {};
      }
      
      if (!updated.structured_data[section]) {
        updated.structured_data[section] = {};
      }
      
      updated.structured_data[section][field] = checked;
      return updated;
    });
  };

  const updateNestedField = (section: string, nestedSection: string, field: string, value: any) => {
    setValidatedData(prev => {
      const updated = { ...prev };
      if (!updated.structured_data) {
        updated.structured_data = {};
      }
      
      if (!updated.structured_data[section]) {
        updated.structured_data[section] = {};
      }
      
      if (!updated.structured_data[section][nestedSection]) {
        updated.structured_data[section][nestedSection] = {};
      }
      
      updated.structured_data[section][nestedSection][field] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ 
          extracted_data: validatedData,
          validation_status: 'validated',
          validated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select();
      
      if (error) {
        console.error('Error saving validated data:', error);
        toast.error("Failed to save validation", {
          description: error.message
        });
        return;
      }
      
      toast.success("Validation saved successfully", {
        description: "The document has been validated and saved."
      });
      
      onSave(validatedData);
    } catch (error) {
      console.error('Error in validation save process:', error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPatientFields = () => {
    if (!validatedData.structured_data || !validatedData.structured_data.patient) return null;
    
    const patient = validatedData.structured_data.patient;
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(patient).map(([key, value]: [string, any]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null;
            
            const confidence = getConfidenceLevel(value);
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={`patient_${key}`}>{displayKey}</Label>
                  {getConfidenceBadge(confidence)}
                </div>
                <Input
                  id={`patient_${key}`}
                  value={value?.toString() || ''}
                  onChange={(e) => updateField('patient', key, e.target.value)}
                  className={cn(`border`, {
                    'border-red-300 bg-red-50': confidence === 'low',
                    'border-yellow-300 bg-yellow-50': confidence === 'medium',
                    'border-green-300 bg-green-50': confidence === 'high'
                  })}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExaminationFields = () => {
    if (!validatedData.structured_data || !validatedData.structured_data.examination_results) return null;
    
    const examination = validatedData.structured_data.examination_results;
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Examination Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(examination).map(([key, value]: [string, any]) => {
            if ((typeof value === 'object' && value !== null && !Array.isArray(value)) || key === 'type' || key === 'test_results') return null;
            
            const confidence = getConfidenceLevel(value);
            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={`exam_${key}`}>{displayKey}</Label>
                  {getConfidenceBadge(confidence)}
                </div>
                <Input
                  id={`exam_${key}`}
                  value={value?.toString() || ''}
                  onChange={(e) => updateField('examination_results', key, e.target.value)}
                  className={cn(`border`, {
                    'border-red-300 bg-red-50': confidence === 'low',
                    'border-yellow-300 bg-yellow-50': confidence === 'medium',
                    'border-green-300 bg-green-50': confidence === 'high'
                  })}
                />
              </div>
            );
          })}
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Examination Type</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {examination.type && Object.entries(examination.type).map(([key, value]: [string, any]) => {
              const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`exam_type_${key}`}
                    checked={!!value}
                    onCheckedChange={(checked) => {
                      updateNestedField('examination_results', 'type', key, !!checked);
                    }}
                  />
                  <Label htmlFor={`exam_type_${key}`}>{displayKey}</Label>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Medical Tests</h4>
          <div className="border rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examination.test_results && Object.keys(examination.test_results)
                .filter(key => key.endsWith('_done'))
                .map(key => {
                  const baseKey = key.replace('_done', '');
                  const resultsKey = `${baseKey}_results`;
                  const displayKey = baseKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const isDone = !!examination.test_results[key];
                  const results = examination.test_results[resultsKey]?.toString() || '';
                  
                  return (
                    <div key={key} className="space-y-2 border-b pb-2 md:border-b-0 md:pb-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`test_${key}`}
                            checked={isDone}
                            onCheckedChange={(checked) => {
                              updateNestedField('examination_results', 'test_results', key, !!checked);
                            }}
                          />
                          <Label htmlFor={`test_${key}`}>{displayKey}</Label>
                        </div>
                      </div>
                      <Input
                        id={`test_${resultsKey}`}
                        value={results}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', resultsKey, e.target.value)}
                        className="border border-gray-300"
                        placeholder="Test results"
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificationFields = () => {
    if (!validatedData.structured_data || !validatedData.structured_data.certification) return null;
    
    const certification = validatedData.structured_data.certification;
    const restrictions = validatedData.structured_data.restrictions || {};
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Certification Details</h3>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Fitness Status</h4>
          <div className="grid grid-cols-1 gap-2">
            {['fit', 'fit_with_restrictions', 'fit_with_condition', 'temporarily_unfit', 'unfit'].map((key) => {
              const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`certification_${key}`}
                    checked={!!certification[key]}
                    onCheckedChange={(checked) => {
                      updateField('certification', key, !!checked);
                    }}
                  />
                  <Label htmlFor={`certification_${key}`}>{displayKey}</Label>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(certification)
            .filter(([key]) => !['fit', 'fit_with_restrictions', 'fit_with_condition', 'temporarily_unfit', 'unfit', 'comments'].includes(key))
            .map(([key, value]: [string, any]) => {
              const confidence = getConfidenceLevel(value);
              const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`cert_${key}`}>{displayKey}</Label>
                    {getConfidenceBadge(confidence)}
                  </div>
                  <Input
                    id={`cert_${key}`}
                    value={value?.toString() || ''}
                    onChange={(e) => updateField('certification', key, e.target.value)}
                    className={cn(`border`, {
                      'border-red-300 bg-red-50': confidence === 'low',
                      'border-yellow-300 bg-yellow-50': confidence === 'medium',
                      'border-green-300 bg-green-50': confidence === 'high'
                    })}
                  />
                </div>
              );
            })}
        </div>
        
        <div className="space-y-4">
          <h4 className="text-md font-medium">Restrictions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {restrictions && Object.entries(restrictions).map(([key, value]: [string, any]) => {
              const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`restriction_${key}`}
                    checked={!!value}
                    onCheckedChange={(checked) => {
                      updateField('restrictions', key, !!checked);
                    }}
                  />
                  <Label htmlFor={`restriction_${key}`}>{displayKey}</Label>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-2 mt-4">
          <Label htmlFor="cert_comments">Comments</Label>
          <Textarea
            id="cert_comments"
            value={certification.comments?.toString() || ''}
            onChange={(e) => updateField('certification', 'comments', e.target.value)}
            className="min-h-[100px] border border-gray-300"
          />
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full shadow-md">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Validate Certificate Data</h2>
            <div className="flex space-x-2 items-center">
              {getConfidenceBadge("high")}
              {getConfidenceBadge("medium")}
              {getConfidenceBadge("low")}
            </div>
          </div>
          
          <Tabs defaultValue="patient" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="examination">Examination</TabsTrigger>
              <TabsTrigger value="certification">Certification</TabsTrigger>
            </TabsList>
            
            <div className="h-[calc(100vh-320px)] overflow-auto pr-2">
              <TabsContent value="patient" className="space-y-4 mt-0 p-1">
                {renderPatientFields()}
              </TabsContent>
              
              <TabsContent value="examination" className="space-y-4 mt-0 p-1">
                {renderExaminationFields()}
              </TabsContent>
              
              <TabsContent value="certification" className="space-y-4 mt-0 p-1">
                {renderCertificationFields()}
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Validation"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateValidator;
