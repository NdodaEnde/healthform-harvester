
import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { FormField, FormTemplate, FieldType } from './FormFieldTypes';
import { v4 as uuidv4 } from 'uuid';
import { FormBuilderService } from './FormBuilderService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Trash2, Plus, Grip, EyeIcon, Save } from 'lucide-react';

interface FormBuilderProps {
  initialTemplate?: FormTemplate;
  onSave: (template: FormTemplate) => void;
}

const DEFAULT_FIELD: Omit<FormField, 'id'> = {
  type: 'text',
  label: 'New Field',
  placeholder: '',
  required: false,
};

const FormBuilder: React.FC<FormBuilderProps> = ({ initialTemplate, onSave }) => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  const [template, setTemplate] = useState<FormTemplate>(() => {
    if (initialTemplate) {
      return initialTemplate;
    }
    
    return {
      id: uuidv4(),
      name: 'New Form Template',
      description: '',
      organizationId,
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      category: 'General',
    };
  });
  
  const [activeTab, setActiveTab] = useState<string>('fields');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  useEffect(() => {
    // Update organization ID if it changes
    if (organizationId && template.organizationId !== organizationId) {
      setTemplate(prev => ({ ...prev, organizationId }));
    }
  }, [organizationId]);
  
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCategoryChange = (category: string) => {
    setTemplate(prev => ({ ...prev, category }));
  };
  
  const addField = () => {
    const newField: FormField = {
      ...DEFAULT_FIELD,
      id: uuidv4(),
    };
    
    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };
  
  const updateField = (id: string, updates: Partial<FormField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      ),
    }));
  };
  
  const removeField = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== id),
    }));
  };
  
  const moveField = (fromIndex: number, toIndex: number) => {
    setTemplate(prev => {
      const newFields = [...prev.fields];
      const [movedField] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, movedField);
      return { ...prev, fields: newFields };
    });
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    moveField(sourceIndex, destIndex);
  };
  
  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(template.fields.find(f => f.id === fieldId)?.options || []), '']
    });
  };
  
  const updateOption = (fieldId: string, index: number, value: string) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;
    
    const newOptions = [...field.options];
    newOptions[index] = value;
    
    updateField(fieldId, { options: newOptions });
  };
  
  const removeOption = (fieldId: string, index: number) => {
    const field = template.fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;
    
    const newOptions = [...field.options];
    newOptions.splice(index, 1);
    
    updateField(fieldId, { options: newOptions });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template.name.trim()) {
      toast.error('Please provide a template name');
      return;
    }
    
    if (template.fields.length === 0) {
      toast.error('Please add at least one field to the template');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const savedTemplate = await FormBuilderService.saveFormTemplate(template);
      onSave(savedTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save the template');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                <TabsTrigger value="fields">
                  Form Fields
                </TabsTrigger>
                <TabsTrigger value="settings">
                  Template Settings
                </TabsTrigger>
              </TabsList>
          
              <TabsContent value="settings" className="border-none p-0 mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={template.name}
                        onChange={handleBasicInfoChange}
                        placeholder="Enter template name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={template.category || 'General'} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Assessment">Assessment</SelectItem>
                          <SelectItem value="Registration">Registration</SelectItem>
                          <SelectItem value="Feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={template.description || ''}
                      onChange={handleBasicInfoChange}
                      placeholder="Enter template description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      checked={template.isPublished}
                      onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, isPublished: checked }))}
                    />
                    <Label htmlFor="isPublished">
                      {template.isPublished ? 'Published' : 'Draft'}
                    </Label>
                    {template.isPublished && (
                      <Badge className="ml-2" variant="success">
                        Published
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsContent>
            
              <TabsContent value="fields" className="border-none p-0 mt-4">
                <div className="space-y-4">
                  <Button
                    type="button"
                    onClick={addField}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-4"
                        >
                          {template.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border border-gray-200"
                                >
                                  <CardHeader className="flex flex-row items-center justify-between p-4">
                                    <div className="flex items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mr-2 cursor-grab"
                                      >
                                        <Grip className="h-5 w-5 text-gray-400" />
                                      </div>
                                      <CardTitle className="text-lg font-medium flex items-center">
                                        <Badge className="mr-2 capitalize">
                                          {field.type}
                                        </Badge>
                                        {field.label}
                                        {field.required && (
                                          <span className="text-red-500 ml-1">*</span>
                                        )}
                                      </CardTitle>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeField(field.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0 grid gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-${field.id}-label`}>
                                          Field Label
                                        </Label>
                                        <Input
                                          id={`field-${field.id}-label`}
                                          value={field.label}
                                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                                          placeholder="Enter field label"
                                        />
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-${field.id}-type`}>
                                          Field Type
                                        </Label>
                                        <Select
                                          value={field.type}
                                          onValueChange={(value: FieldType) => updateField(field.id, { type: value })}
                                        >
                                          <SelectTrigger id={`field-${field.id}-type`}>
                                            <SelectValue placeholder="Select field type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="textarea">Textarea</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="tel">Phone</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                            <SelectItem value="multiselect">Multi-select</SelectItem>
                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                            <SelectItem value="radio">Radio</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-${field.id}-placeholder`}>
                                          Placeholder
                                        </Label>
                                        <Input
                                          id={`field-${field.id}-placeholder`}
                                          value={field.placeholder || ''}
                                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                          placeholder="Enter placeholder text"
                                        />
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-${field.id}-defaultValue`}>
                                          Default Value
                                        </Label>
                                        <Input
                                          id={`field-${field.id}-defaultValue`}
                                          value={field.defaultValue || ''}
                                          onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                                          placeholder="Enter default value"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`field-${field.id}-required`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                      />
                                      <Label htmlFor={`field-${field.id}-required`}>
                                        Required Field
                                      </Label>
                                    </div>
                                    
                                    {['select', 'multiselect', 'radio'].includes(field.type) && (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <Label>Options</Label>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addOption(field.id)}
                                          >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Option
                                          </Button>
                                        </div>
                                        
                                        {field.options?.map((option, optionIndex) => (
                                          <div key={optionIndex} className="flex items-center space-x-2">
                                            <Input
                                              value={option}
                                              onChange={(e) => updateOption(field.id, optionIndex, e.target.value)}
                                              placeholder={`Option ${optionIndex + 1}`}
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeOption(field.id, optionIndex)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                        
                                        {(!field.options || field.options.length === 0) && (
                                          <p className="text-sm text-muted-foreground">
                                            No options added yet. Click "Add Option" to add some.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  
                  {template.fields.length === 0 && (
                    <div className="text-center py-8 border rounded-lg bg-muted/30">
                      <h3 className="text-lg font-medium mb-2">No fields added yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your form by adding fields.
                      </p>
                      <Button
                        type="button"
                        onClick={addField}
                        variant="default"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Field
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
          
          <CardFooter className="flex justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'} in this template
            </div>
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

export default FormBuilder;
