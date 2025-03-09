
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, HelpCircle, Check, Circle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState('certificate');

  const getConfidenceLevel = (value: any): "high" | "medium" | "low" => {
    if (!value) return "low";
    if (typeof value === "string") {
      if (value.includes("N/A") || value.includes("n/a") || value === "[]" || value === "[object Object]") return "medium";
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
      </div>
    );
  };

  const renderCertificateForm = () => {
    if (!validatedData.structured_data) {
      setValidatedData(prev => ({
        ...prev,
        structured_data: {
          patient: {},
          certification: {},
          examination_results: {
            test_results: {}
          },
          restrictions: {}
        }
      }));
      return null;
    }

    const patient = validatedData.structured_data.patient || {};
    const certification = validatedData.structured_data.certification || {};
    const restrictions = validatedData.structured_data.restrictions || {};
    const examination = validatedData.structured_data.examination_results || {};
    const testResults = examination.test_results || {};

    return (
      <div className="space-y-8">
        {/* Certificate Header */}
        <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
          <h2 className="text-2xl font-bold">CERTIFICATE OF FITNESS</h2>
        </div>

        {/* Doctor/Practice Information */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Label htmlFor="doctor_info" className="w-32 font-bold">Doctor Info:</Label>
            <Input
              id="doctor_info"
              value={certification.doctor_info || ''}
              onChange={(e) => updateField('certification', 'doctor_info', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Patient Information */}
        <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
          <h3 className="font-bold text-lg">Patient Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Label htmlFor="patient_name" className="w-32 font-bold">Initials & Surname:</Label>
              <Input
                id="patient_name"
                value={patient.name || ''}
                onChange={(e) => updateField('patient', 'name', e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center">
              <Label htmlFor="patient_id" className="w-32 font-bold">ID NO:</Label>
              <Input
                id="patient_id"
                value={patient.id_number || ''}
                onChange={(e) => updateField('patient', 'id_number', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center">
            <Label htmlFor="company_name" className="w-32 font-bold">Company Name:</Label>
            <Input
              id="company_name"
              value={patient.company_name || ''}
              onChange={(e) => updateField('patient', 'company_name', e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Label htmlFor="exam_date" className="w-32 font-bold">Date of Exam:</Label>
              <Input
                id="exam_date"
                value={certification.examination_date || ''}
                onChange={(e) => updateField('certification', 'examination_date', e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center">
              <Label htmlFor="expiry_date" className="w-32 font-bold">Expiry Date:</Label>
              <Input
                id="expiry_date"
                value={certification.expiry_date || ''}
                onChange={(e) => updateField('certification', 'expiry_date', e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center">
            <Label htmlFor="job_title" className="w-32 font-bold">Job Title:</Label>
            <Input
              id="job_title"
              value={patient.job_title || ''}
              onChange={(e) => updateField('patient', 'job_title', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Examination Type */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 gap-0 border-b">
            <div className="border-r p-3 font-bold text-center bg-gray-100">PRE-EMPLOYMENT</div>
            <div className="border-r p-3 font-bold text-center bg-gray-100">PERIODICAL</div>
            <div className="p-3 font-bold text-center bg-gray-100">EXIT</div>
          </div>
          <div className="grid grid-cols-3 gap-0">
            <div className="border-r p-4 text-center">
              <Checkbox 
                checked={certification.pre_employment || false}
                onCheckedChange={(checked) => updateField('certification', 'pre_employment', !!checked)}
                className="size-6"
              />
            </div>
            <div className="border-r p-4 text-center">
              <Checkbox 
                checked={certification.periodical || false}
                onCheckedChange={(checked) => updateField('certification', 'periodical', !!checked)}
                className="size-6"
              />
            </div>
            <div className="p-4 text-center">
              <Checkbox 
                checked={certification.exit || false}
                onCheckedChange={(checked) => updateField('certification', 'exit', !!checked)}
                className="size-6"
              />
            </div>
          </div>
        </div>

        {/* Medical Tests Section */}
        <div>
          <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
            <h2 className="text-xl font-bold">MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Left column - Tests */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border-r w-1/2">TESTS</th>
                    <th className="p-2 text-center border-r w-1/6">Done</th>
                    <th className="p-2 text-left">Results</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2 border-r">BLOODS</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.blood_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'blood_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.blood_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'blood_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">FAR, NEAR VISION</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.vision_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'vision_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.vision_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'vision_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">SIDE & DEPTH</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.depth_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'depth_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.depth_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'depth_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">NIGHT VISION</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.night_vision_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'night_vision_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.night_vision_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'night_vision_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Right column - Other tests */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border-r w-1/2">OTHER TESTS</th>
                    <th className="p-2 text-center border-r w-1/6">Done</th>
                    <th className="p-2 text-left">Results</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-2 border-r">Hearing</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.hearing_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'hearing_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.hearing_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'hearing_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">Working at Heights</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.heights_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'heights_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.heights_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'heights_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">Lung Function</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.lung_test_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'lung_test_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.lung_test_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'lung_test_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">X-Ray</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.xray_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'xray_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.xray_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'xray_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2 border-r">Drug Screen</td>
                    <td className="p-2 border-r text-center">
                      <Checkbox 
                        checked={testResults.drug_screen_done || false}
                        onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'drug_screen_done', !!checked)}
                        className="size-6"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        value={testResults.drug_screen_results || ''}
                        onChange={(e) => updateNestedField('examination_results', 'test_results', 'drug_screen_results', e.target.value)}
                        className="w-full"
                        placeholder="Results"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Follow up and Review date */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="follow_up" className="font-bold block mb-2">Referred or follow up actions:</Label>
            <Input
              id="follow_up"
              value={certification.follow_up || ''}
              onChange={(e) => updateField('certification', 'follow_up', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="review_date" className="font-bold block mb-2">Review Date:</Label>
            <Input
              id="review_date"
              value={certification.review_date || ''}
              onChange={(e) => updateField('certification', 'review_date', e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Restrictions */}
        <div>
          <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
            <h2 className="text-xl font-bold">RESTRICTIONS:</h2>
          </div>
          
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              <div className={cn("p-4 flex flex-col items-center justify-start border-r border-b", {
                "bg-yellow-50": restrictions.heights
              })}>
                <span className="font-bold mb-2">Heights</span>
                <Checkbox 
                  checked={restrictions.heights || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'heights', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-r border-b", {
                "bg-yellow-50": restrictions.dust_exposure
              })}>
                <span className="font-bold mb-2">Dust Exposure</span>
                <Checkbox 
                  checked={restrictions.dust_exposure || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'dust_exposure', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-r border-b", {
                "bg-yellow-50": restrictions.motorized_equipment
              })}>
                <span className="font-bold mb-2">Motorized Equipment</span>
                <Checkbox 
                  checked={restrictions.motorized_equipment || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'motorized_equipment', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-b", {
                "bg-yellow-50": restrictions.hearing_protection
              })}>
                <span className="font-bold mb-2">Wear Hearing Protection</span>
                <Checkbox 
                  checked={restrictions.hearing_protection || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'hearing_protection', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-r", {
                "bg-yellow-50": restrictions.confined_spaces
              })}>
                <span className="font-bold mb-2">Confined Spaces</span>
                <Checkbox 
                  checked={restrictions.confined_spaces || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'confined_spaces', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-r", {
                "bg-yellow-50": restrictions.chemical_exposure
              })}>
                <span className="font-bold mb-2">Chemical Exposure</span>
                <Checkbox 
                  checked={restrictions.chemical_exposure || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'chemical_exposure', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start border-r", {
                "bg-yellow-50": restrictions.spectacles
              })}>
                <span className="font-bold mb-2">Wear Spectacles</span>
                <Checkbox 
                  checked={restrictions.spectacles || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'spectacles', !!checked)}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-start", {
                "bg-yellow-50": restrictions.chronic_treatment
              })}>
                <span className="font-bold mb-2 text-center">Remain on Treatment for Chronic Conditions</span>
                <Checkbox 
                  checked={restrictions.chronic_treatment || false}
                  onCheckedChange={(checked) => updateField('restrictions', 'chronic_treatment', !!checked)}
                  className="size-6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label htmlFor="comments" className="font-bold">Comments:</Label>
          <Textarea
            id="comments"
            value={certification.comments || ''}
            onChange={(e) => updateField('certification', 'comments', e.target.value)}
            className="w-full min-h-[100px]"
          />
        </div>

        {/* Fitness Assessment */}
        <div>
          <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
            <h2 className="text-xl font-bold">FITNESS ASSESSMENT</h2>
          </div>
          
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-0">
              <div className={cn("p-4 flex flex-col items-center justify-center border-r", {
                "bg-green-100": certification.fit
              })}>
                <span className="font-bold mb-2">FIT</span>
                <Checkbox 
                  checked={certification.fit || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField('certification', 'fit', true);
                      updateField('certification', 'fit_with_restrictions', false);
                      updateField('certification', 'fit_with_condition', false);
                      updateField('certification', 'temporarily_unfit', false);
                      updateField('certification', 'unfit', false);
                    } else {
                      updateField('certification', 'fit', false);
                    }
                  }}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-center border-r", {
                "bg-yellow-100": certification.fit_with_restrictions
              })}>
                <span className="font-bold mb-2 text-center">Fit with Restriction</span>
                <Checkbox 
                  checked={certification.fit_with_restrictions || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField('certification', 'fit', false);
                      updateField('certification', 'fit_with_restrictions', true);
                      updateField('certification', 'fit_with_condition', false);
                      updateField('certification', 'temporarily_unfit', false);
                      updateField('certification', 'unfit', false);
                    } else {
                      updateField('certification', 'fit_with_restrictions', false);
                    }
                  }}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-center border-r", {
                "bg-yellow-100": certification.fit_with_condition
              })}>
                <span className="font-bold mb-2 text-center">Fit with Condition</span>
                <Checkbox 
                  checked={certification.fit_with_condition || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField('certification', 'fit', false);
                      updateField('certification', 'fit_with_restrictions', false);
                      updateField('certification', 'fit_with_condition', true);
                      updateField('certification', 'temporarily_unfit', false);
                      updateField('certification', 'unfit', false);
                    } else {
                      updateField('certification', 'fit_with_condition', false);
                    }
                  }}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-center border-r", {
                "bg-orange-100": certification.temporarily_unfit
              })}>
                <span className="font-bold mb-2 text-center">Temporary Unfit</span>
                <Checkbox 
                  checked={certification.temporarily_unfit || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField('certification', 'fit', false);
                      updateField('certification', 'fit_with_restrictions', false);
                      updateField('certification', 'fit_with_condition', false);
                      updateField('certification', 'temporarily_unfit', true);
                      updateField('certification', 'unfit', false);
                    } else {
                      updateField('certification', 'temporarily_unfit', false);
                    }
                  }}
                  className="size-6"
                />
              </div>
              <div className={cn("p-4 flex flex-col items-center justify-center", {
                "bg-red-100": certification.unfit
              })}>
                <span className="font-bold mb-2">UNFIT</span>
                <Checkbox 
                  checked={certification.unfit || false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateField('certification', 'fit', false);
                      updateField('certification', 'fit_with_restrictions', false);
                      updateField('certification', 'fit_with_condition', false);
                      updateField('certification', 'temporarily_unfit', false);
                      updateField('certification', 'unfit', true);
                    } else {
                      updateField('certification', 'unfit', false);
                    }
                  }}
                  className="size-6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Signature */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="doctor_signature" className="font-bold block mb-2">Doctor Signature:</Label>
              <div className="h-20 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500">
                Signature Area
              </div>
            </div>
            <div>
              <Label htmlFor="doctor_stamp" className="font-bold block mb-2">Doctor Stamp:</Label>
              <div className="h-20 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500">
                Stamp Area
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
  <Card className="w-full shadow-md flex flex-col h-screen">
    <CardContent className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Validate Certificate Data</h2>
        <div className="flex space-x-2 items-center">
          {getConfidenceBadge("high")}
          {getConfidenceBadge("medium")}
          {getConfidenceBadge("low")}
        </div>
      </div>
      
      <Tabs 
        defaultValue="certificate" 
        className="w-full flex flex-col h-[calc(100%-80px)]"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="original">Original Document</TabsTrigger>
          <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <TabsContent value="certificate" className="space-y-4 mt-0 p-1 pb-24">
            {renderCertificateForm()}
          </TabsContent>
          
          <TabsContent value="original" className="mt-0 p-1">
            <div className="flex justify-center">
              <div className="border rounded-lg shadow-sm p-4 bg-gray-50 text-center">
                <p>Original document image would be displayed here</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="extracted" className="mt-0 p-1">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-medium mb-4">Extracted JSON Data</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(validatedData, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? "Saving..." : "Save Validation"}
        </Button>
      </div>
    </CardContent>
  </Card>
);
};

export default CertificateValidator;