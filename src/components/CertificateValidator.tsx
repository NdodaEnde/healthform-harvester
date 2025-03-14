
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
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">PATIENT INFORMATION</h2>
      </div>
      
      {/* Core Patient Information */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="patient_name" className="font-bold">Initials & Surname</Label>
              {getConfidenceBadge(getConfidenceLevel(patient.name))}
            </div>
            <Input
              id="patient_name"
              value={patient.name || ''}
              onChange={(e) => updateField('patient', 'name', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(patient.name) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(patient.name) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(patient.name) === 'high'
              })}
            />
          </div>
          
          {/* ID Number */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="patient_id" className="font-bold">ID Number</Label>
              {getConfidenceBadge(getConfidenceLevel(patient.id_number))}
            </div>
            <Input
              id="patient_id"
              value={patient.id_number || ''}
              onChange={(e) => updateField('patient', 'id_number', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(patient.id_number) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(patient.id_number) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(patient.id_number) === 'high'
              })}
            />
            <p className="text-sm text-gray-500">Format: [ID Number] (e.g., 900304 5496 084)</p>
          </div>
          
          {/* Company Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="company_name" className="font-bold">Company Name</Label>
              {getConfidenceBadge(getConfidenceLevel(patient.company_name))}
            </div>
            <Input
              id="company_name"
              value={patient.company_name || ''}
              onChange={(e) => updateField('patient', 'company_name', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(patient.company_name) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(patient.company_name) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(patient.company_name) === 'high'
              })}
            />
          </div>
          
          {/* Job Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="job_title" className="font-bold">Job Title</Label>
              {getConfidenceBadge(getConfidenceLevel(patient.job_title))}
            </div>
            <Input
              id="job_title"
              value={patient.job_title || ''}
              onChange={(e) => updateField('patient', 'job_title', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(patient.job_title) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(patient.job_title) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(patient.job_title) === 'high'
              })}
            />
          </div>
        </div>
      </div>
      
      {/* Additional Patient Information */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-bold text-lg mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(patient)
            .filter(([key]) => !["name", "id_number", "company_name", "job_title"].includes(key))
            .map(([key, value]: [string, any]) => {
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
    </div>
  );
};

const renderExaminationFields = () => {
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
  
  const certification = validatedData.structured_data.certification || {};
  const examination = validatedData.structured_data.examination_results || {};
  const testResults = examination.test_results || {};
  
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white text-center p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">EXAMINATION DETAILS</h2>
      </div>
      
      {/* Examination Dates */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-bold text-lg mb-4">Examination Dates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Examination Date */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="exam_date" className="font-bold">Date of Examination</Label>
              {getConfidenceBadge(getConfidenceLevel(certification.examination_date))}
            </div>
            <Input
              id="exam_date"
              value={certification.examination_date || ''}
              onChange={(e) => updateField('certification', 'examination_date', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(certification.examination_date) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(certification.examination_date) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(certification.examination_date) === 'high'
              })}
            />
            <p className="text-sm text-gray-500">Format: DD-MM-YYYY (e.g., 26-02-2015)</p>
          </div>
          
          {/* Expiry Date */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="expiry_date" className="font-bold">Expiry Date</Label>
              {getConfidenceBadge(getConfidenceLevel(certification.expiry_date))}
            </div>
            <Input
              id="expiry_date"
              value={certification.expiry_date || ''}
              onChange={(e) => updateField('certification', 'expiry_date', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(certification.expiry_date) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(certification.expiry_date) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(certification.expiry_date) === 'high'
              })}
            />
            <p className="text-sm text-gray-500">Format: DD-MM-YYYY (e.g., 26-02-2016)</p>
          </div>
          
          {/* Review Date */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="review_date" className="font-bold">Review Date</Label>
              {getConfidenceBadge(getConfidenceLevel(certification.review_date))}
            </div>
            <Input
              id="review_date"
              value={certification.review_date || ''}
              onChange={(e) => updateField('certification', 'review_date', e.target.value)}
              className={cn(`border`, {
                'border-red-300 bg-red-50': getConfidenceLevel(certification.review_date) === 'low',
                'border-yellow-300 bg-yellow-50': getConfidenceLevel(certification.review_date) === 'medium',
                'border-green-300 bg-green-50': getConfidenceLevel(certification.review_date) === 'high'
              })}
            />
          </div>
        </div>
      </div>
      
      {/* Examination Type */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-bold text-lg mb-4">Examination Type</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 font-bold text-center">PRE-EMPLOYMENT</div>
            <div className="p-4 flex justify-center">
              <Checkbox 
                id="pre_employment"
                checked={certification.pre_employment || false}
                onCheckedChange={(checked) => updateField('certification', 'pre_employment', !!checked)}
                className="size-6"
              />
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 font-bold text-center">PERIODICAL</div>
            <div className="p-4 flex justify-center">
              <Checkbox 
                id="periodical"
                checked={certification.periodical || false}
                onCheckedChange={(checked) => updateField('certification', 'periodical', !!checked)}
                className="size-6"
              />
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-3 font-bold text-center">EXIT</div>
            <div className="p-4 flex justify-center">
              <Checkbox 
                id="exit"
                checked={certification.exit || false}
                onCheckedChange={(checked) => updateField('certification', 'exit', !!checked)}
                className="size-6"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Medical Tests */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-bold text-lg mb-4">Medical Tests</h3>
        
        {/* Blood & Vision Tests */}
        <div className="mb-6">
          <h4 className="font-medium text-md mb-3 border-b pb-1">Blood & Vision Tests</h4>
          <div className="grid grid-cols-1 gap-4">
            {/* BLOODS */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="blood_test_done"
                    checked={testResults.blood_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'blood_test_done', !!checked)}
                  />
                  <Label htmlFor="blood_test_done" className="font-bold">BLOODS</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.blood_test_results))}
              </div>
              <Input 
                value={testResults.blood_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'blood_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.blood_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.blood_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.blood_test_results) === 'high'
                })}
                placeholder="Blood test results"
              />
            </div>
            
            {/* FAR, NEAR VISION */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="vision_test_done"
                    checked={testResults.vision_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'vision_test_done', !!checked)}
                  />
                  <Label htmlFor="vision_test_done" className="font-bold">FAR, NEAR VISION</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.vision_test_results))}
              </div>
              <Input 
                value={testResults.vision_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'vision_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.vision_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.vision_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.vision_test_results) === 'high'
                })}
                placeholder="Vision test results (e.g., 20/30)"
              />
            </div>
            
            {/* SIDE & DEPTH */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="depth_test_done"
                    checked={testResults.depth_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'depth_test_done', !!checked)}
                  />
                  <Label htmlFor="depth_test_done" className="font-bold">SIDE & DEPTH</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.depth_test_results))}
              </div>
              <Input 
                value={testResults.depth_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'depth_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.depth_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.depth_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.depth_test_results) === 'high'
                })}
                placeholder="Side & depth test results (e.g., Normal)"
              />
            </div>
            
            {/* NIGHT VISION */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="night_vision_done"
                    checked={testResults.night_vision_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'night_vision_done', !!checked)}
                  />
                  <Label htmlFor="night_vision_done" className="font-bold">NIGHT VISION</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.night_vision_results))}
              </div>
              <Input 
                value={testResults.night_vision_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'night_vision_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.night_vision_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.night_vision_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.night_vision_results) === 'high'
                })}
                placeholder="Night vision test results (e.g., 20/30)"
              />
            </div>
          </div>
        </div>
        
        {/* Other Medical Tests */}
        <div>
          <h4 className="font-medium text-md mb-3 border-b pb-1">Other Medical Tests</h4>
          <div className="grid grid-cols-1 gap-4">
            {/* HEARING */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="hearing_test_done"
                    checked={testResults.hearing_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'hearing_test_done', !!checked)}
                  />
                  <Label htmlFor="hearing_test_done" className="font-bold">HEARING</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.hearing_test_results))}
              </div>
              <Input 
                value={testResults.hearing_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'hearing_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.hearing_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.hearing_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.hearing_test_results) === 'high'
                })}
                placeholder="Hearing test results (e.g., 3.4)"
              />
            </div>
            
            {/* WORKING AT HEIGHTS */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="heights_test_done"
                    checked={testResults.heights_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'heights_test_done', !!checked)}
                  />
                  <Label htmlFor="heights_test_done" className="font-bold">WORKING AT HEIGHTS</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.heights_test_results))}
              </div>
              <Input 
                value={testResults.heights_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'heights_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.heights_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.heights_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.heights_test_results) === 'high'
                })}
                placeholder="Heights test results (e.g., N/A)"
              />
            </div>
            
            {/* LUNG FUNCTION */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="lung_test_done"
                    checked={testResults.lung_test_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'lung_test_done', !!checked)}
                  />
                  <Label htmlFor="lung_test_done" className="font-bold">LUNG FUNCTION</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.lung_test_results))}
              </div>
              <Input 
                value={testResults.lung_test_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'lung_test_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.lung_test_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.lung_test_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.lung_test_results) === 'high'
                })}
                placeholder="Lung function test results (e.g., Mild Restriction)"
              />
            </div>
            
            {/* X-RAY */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="xray_done"
                    checked={testResults.xray_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'xray_done', !!checked)}
                  />
                  <Label htmlFor="xray_done" className="font-bold">X-RAY</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.xray_results))}
              </div>
              <Input 
                value={testResults.xray_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'xray_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.xray_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.xray_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.xray_results) === 'high'
                })}
                placeholder="X-ray results (e.g., N/A)"
              />
            </div>
            
            {/* DRUG SCREEN */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="drug_screen_done"
                    checked={testResults.drug_screen_done || false}
                    onCheckedChange={(checked) => updateNestedField('examination_results', 'test_results', 'drug_screen_done', !!checked)}
                  />
                  <Label htmlFor="drug_screen_done" className="font-bold">DRUG SCREEN</Label>
                </div>
                {getConfidenceBadge(getConfidenceLevel(testResults.drug_screen_results))}
              </div>
              <Input 
                value={testResults.drug_screen_results || ''}
                onChange={(e) => updateNestedField('examination_results', 'test_results', 'drug_screen_results', e.target.value)}
                className={cn(`border w-full`, {
                  'border-red-300 bg-red-50': getConfidenceLevel(testResults.drug_screen_results) === 'low',
                  'border-yellow-300 bg-yellow-50': getConfidenceLevel(testResults.drug_screen_results) === 'medium',
                  'border-green-300 bg-green-50': getConfidenceLevel(testResults.drug_screen_results) === 'high'
                })}
                placeholder="Drug screen results (e.g., N/A)"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Follow-up */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-bold text-lg mb-4">Follow-up Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="follow_up" className="font-bold">Referred or follow up actions</Label>
            {getConfidenceBadge(getConfidenceLevel(certification.follow_up))}
          </div>
          <Textarea
            id="follow_up"
            value={certification.follow_up || ''}
            onChange={(e) => updateField('certification', 'follow_up', e.target.value)}
            className={cn(`border w-full min-h-[100px]`, {
              'border-red-300 bg-red-50': getConfidenceLevel(certification.follow_up) === 'low',
              'border-yellow-300 bg-yellow-50': getConfidenceLevel(certification.follow_up) === 'medium',
              'border-green-300 bg-green-50': getConfidenceLevel(certification.follow_up) === 'high'
            })}
            placeholder="Enter any follow-up actions or referrals"
          />
        </div>
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
        defaultValue="patient" 
        className="w-full flex flex-col flex-1"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="patient">Patient</TabsTrigger>
          <TabsTrigger value="examination">Examination</TabsTrigger>
          <TabsTrigger value="certificate">Certificate</TabsTrigger>
          <TabsTrigger value="original">Original</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <TabsContent value="patient" className="mt-0 p-1 pb-24">
            {renderPatientFields()}
          </TabsContent>
          
          <TabsContent value="examination" className="mt-0 p-1 pb-24">
            {renderExaminationFields()}
          </TabsContent>
          
          <TabsContent value="certificate" className="mt-0 p-1 pb-24">
            {renderCertificateForm()}
          </TabsContent>
          
          <TabsContent value="original" className="mt-0 p-1">
            <div className="flex justify-center">
              <div className="border rounded-lg shadow-sm p-4 bg-gray-50 text-center">
                <p>Original document image would be displayed here</p>
              </div>
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? "Saving..." : "Save Validation"}
        </Button>
      </div>
    </CardContent>
  </Card>
);
};

export default CertificateValidator;