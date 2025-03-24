
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { MedicalHistoryData, MedicalCondition, Medication, Allergy } from '@/types/patient';

interface MedicalHistoryEditorProps {
  patientId: string;
  initialData?: MedicalHistoryData;
  onSave: (historyData: MedicalHistoryData) => Promise<void>;
}

const MedicalHistoryEditor: React.FC<MedicalHistoryEditorProps> = ({ 
  patientId, 
  initialData = {}, 
  onSave 
}) => {
  const [historyData, setHistoryData] = useState<MedicalHistoryData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleBooleanChange = (field: keyof MedicalHistoryData) => {
    setHistoryData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHistoryData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const addCondition = () => {
    setHistoryData(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), { name: '' }]
    }));
  };
  
  const updateCondition = (index: number, field: keyof MedicalCondition, value: string) => {
    setHistoryData(prev => {
      const conditions = [...(prev.conditions || [])];
      conditions[index] = { ...conditions[index], [field]: value };
      return { ...prev, conditions };
    });
  };
  
  const removeCondition = (index: number) => {
    setHistoryData(prev => {
      const conditions = [...(prev.conditions || [])];
      conditions.splice(index, 1);
      return { ...prev, conditions };
    });
  };
  
  const addMedication = () => {
    setHistoryData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), { name: '' }]
    }));
  };
  
  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setHistoryData(prev => {
      const medications = [...(prev.medications || [])];
      medications[index] = { ...medications[index], [field]: value };
      return { ...prev, medications };
    });
  };
  
  const removeMedication = (index: number) => {
    setHistoryData(prev => {
      const medications = [...(prev.medications || [])];
      medications.splice(index, 1);
      return { ...prev, medications };
    });
  };
  
  const addAllergy = () => {
    setHistoryData(prev => ({
      ...prev,
      allergies: [...(prev.allergies || []), { allergen: '' }]
    }));
  };
  
  const updateAllergy = (index: number, field: keyof Allergy, value: string) => {
    setHistoryData(prev => {
      const allergies = [...(prev.allergies || [])];
      allergies[index] = { ...allergies[index], [field]: value };
      return { ...prev, allergies };
    });
  };
  
  const removeAllergy = (index: number) => {
    setHistoryData(prev => {
      const allergies = [...(prev.allergies || [])];
      allergies.splice(index, 1);
      return { ...prev, allergies };
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(historyData);
      toast({
        title: "Medical history updated",
        description: "The patient's medical history has been successfully updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update medical history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Common Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_hypertension" 
                checked={historyData.has_hypertension || false}
                onCheckedChange={() => handleBooleanChange('has_hypertension')}
              />
              <Label htmlFor="has_hypertension">Hypertension</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_diabetes" 
                checked={historyData.has_diabetes || false}
                onCheckedChange={() => handleBooleanChange('has_diabetes')}
              />
              <Label htmlFor="has_diabetes">Diabetes</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_heart_disease" 
                checked={historyData.has_heart_disease || false}
                onCheckedChange={() => handleBooleanChange('has_heart_disease')}
              />
              <Label htmlFor="has_heart_disease">Heart Disease</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="has_allergies" 
                checked={historyData.has_allergies || false}
                onCheckedChange={() => handleBooleanChange('has_allergies')}
              />
              <Label htmlFor="has_allergies">Has Allergies</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Medical Conditions</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(historyData.conditions || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No medical conditions recorded.</p>
            ) : (
              (historyData.conditions || []).map((condition, index) => (
                <div key={index} className="grid gap-4 border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <Label htmlFor={`condition-${index}`}>Condition</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeCondition(index)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    id={`condition-${index}`}
                    value={condition.name}
                    onChange={(e) => updateCondition(index, 'name', e.target.value)}
                    placeholder="Condition name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`condition-date-${index}`}>Diagnosed Date</Label>
                      <Input
                        id={`condition-date-${index}`}
                        type="date"
                        value={condition.diagnosed_date || ''}
                        onChange={(e) => updateCondition(index, 'diagnosed_date', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`condition-notes-${index}`}>Notes</Label>
                    <Textarea
                      id={`condition-notes-${index}`}
                      value={condition.notes || ''}
                      onChange={(e) => updateCondition(index, 'notes', e.target.value)}
                      placeholder="Additional notes about this condition"
                      rows={2}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Medications</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(historyData.medications || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No medications recorded.</p>
            ) : (
              (historyData.medications || []).map((medication, index) => (
                <div key={index} className="grid gap-4 border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <Label htmlFor={`medication-${index}`}>Medication</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeMedication(index)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    id={`medication-${index}`}
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="Medication name"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`medication-dosage-${index}`}>Dosage</Label>
                      <Input
                        id={`medication-dosage-${index}`}
                        value={medication.dosage || ''}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        placeholder="e.g., 10mg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`medication-frequency-${index}`}>Frequency</Label>
                      <Input
                        id={`medication-frequency-${index}`}
                        value={medication.frequency || ''}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        placeholder="e.g., Once daily"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`medication-start-${index}`}>Start Date</Label>
                    <Input
                      id={`medication-start-${index}`}
                      type="date"
                      value={medication.start_date || ''}
                      onChange={(e) => updateMedication(index, 'start_date', e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Allergies</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addAllergy}>
              <Plus className="h-4 w-4 mr-1" />
              Add Allergy
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(historyData.allergies || []).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No allergies recorded.</p>
            ) : (
              (historyData.allergies || []).map((allergy, index) => (
                <div key={index} className="grid gap-4 border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <Label htmlFor={`allergy-${index}`}>Allergen</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeAllergy(index)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    id={`allergy-${index}`}
                    value={allergy.allergen}
                    onChange={(e) => updateAllergy(index, 'allergen', e.target.value)}
                    placeholder="Allergen name"
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor={`allergy-severity-${index}`}>Severity</Label>
                    <select
                      id={`allergy-severity-${index}`}
                      value={allergy.severity || ''}
                      onChange={(e) => updateAllergy(index, 'severity', e.target.value as any)}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select severity</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`allergy-reaction-${index}`}>Reaction</Label>
                    <Textarea
                      id={`allergy-reaction-${index}`}
                      value={allergy.reaction || ''}
                      onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                      placeholder="Describe the reaction"
                      rows={2}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              value={historyData.notes || ''}
              onChange={handleTextChange}
              placeholder="Enter any additional notes about the patient's medical history"
              rows={4}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Medical History
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

export default MedicalHistoryEditor;
