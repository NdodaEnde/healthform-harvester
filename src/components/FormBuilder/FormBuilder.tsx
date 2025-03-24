
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormTemplate, FieldType } from './FormFieldTypes';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FormBuilderService } from './FormBuilderService';
import { 
  Trash2, 
  Plus, 
  MoveVertical, 
  Copy, 
  Save, 
  Eye, 
  Calendar,
  TextIcon, 
  ListChecks, 
  CheckSquare, 
  Mail, 
  Phone, 
  Hash, 
  AlignJustify 
} from 'lucide-react';

interface FormBuilderProps {
  initialTemplate?: FormTemplate;
  onSave?: (template: FormTemplate) => void;
}

const getFieldIcon = (type: FieldType) => {
  switch (type) {
    case 'text': return <TextIcon className="w-4 h-4 mr-2" />;
    case 'textarea': return <AlignJustify className="w-4 h-4 mr-2" />;
    case 'number': return <Hash className="w-4 h-4 mr-2" />;
    case 'select': return <ListChecks className="w-4 h-4 mr-2" />;
    case 'multiselect': return <ListChecks className="w-4 h-4 mr-2" />;
    case 'checkbox': return <CheckSquare className="w-4 h-4 mr-2" />;
    case 'date': return <Calendar className="w-4 h-4 mr-2" />;
    case 'email': return <Mail className="w-4 h-4 mr-2" />;
    case 'tel': return <Phone className="w-4 h-4 mr-2" />;
    case 'radio': return <ListChecks className="w-4 h-4 mr-2" />;
    default: return <TextIcon className="w-4 h-4 mr-2" />;
  }
};

const FormBuilder: React.FC<FormBuilderProps> = ({ initialTemplate, onSave }) => {
  const { currentOrganization } = useOrganization();
  const [formName, setFormName] = useState(initialTemplate?.name || '');
  const [formDescription, setFormDescription] = useState(initialTemplate?.description || '');
  const [formCategory, setFormCategory] = useState(initialTemplate?.category || '');
  const [fields, setFields] = useState<FormField[]>(initialTemplate?.fields || []);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'multiselect' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const duplicateField = (field: FormField) => {
    const newField = { ...field, id: uuidv4() };
    setFields([...fields, newField]);
  };

  const openFieldEditor = (field: FormField) => {
    setEditingField(field);
  };

  const updateField = (updatedField: FormField) => {
    setFields(fields.map(field => field.id === updatedField.id ? updatedField : field));
    setEditingField(null);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFields(items);
  };

  const handleSaveTemplate = async () => {
    if (!formName.trim()) {
      toast.error("Please provide a form name");
      return;
    }
    
    if (fields.length === 0) {
      toast.error("Please add at least one field to your form");
      return;
    }

    const formTemplate: FormTemplate = {
      id: initialTemplate?.id || uuidv4(),
      name: formName,
      description: formDescription,
      organizationId: currentOrganization?.id || '',
      fields: fields,
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: initialTemplate?.isPublished || false,
      category: formCategory
    };

    setIsSaving(true);
    try {
      await FormBuilderService.saveFormTemplate(formTemplate);
      toast.success("Form template saved successfully");
      if (onSave) onSave(formTemplate);
    } catch (error) {
      console.error("Error saving form template:", error);
      toast.error("Failed to save form template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Form Template Name"
                  className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={isPreviewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isPreviewMode ? "Edit" : "Preview"}
                </Button>
                <Button 
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="formDescription">Description</Label>
              <Textarea
                id="formDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description"
                className="resize-none"
              />
            </div>
            <div>
              <Label htmlFor="formCategory">Category</Label>
              <Input
                id="formCategory"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="e.g., Medical, HR, Onboarding"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {isPreviewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fields.map(field => (
                <div key={field.id} className="border p-4 rounded-md bg-background">
                  <Label>{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</Label>
                  {renderFieldPreview(field)}
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fields added yet. Switch to edit mode to add fields.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Add Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('text')}>
                    <TextIcon className="w-4 h-4 mr-2" />
                    Text
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('textarea')}>
                    <AlignJustify className="w-4 h-4 mr-2" />
                    Text Area
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('number')}>
                    <Hash className="w-4 h-4 mr-2" />
                    Number
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('select')}>
                    <ListChecks className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('checkbox')}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Checkbox
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('date')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Date
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('email')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('tel')}>
                    <Phone className="w-4 h-4 mr-2" />
                    Phone
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => addField('radio')}>
                    <ListChecks className="w-4 h-4 mr-2" />
                    Radio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>Form Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="form-fields">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-4"
                      >
                        {fields.length === 0 ? (
                          <div className="border-2 border-dashed rounded-md p-8 text-center">
                            <p className="text-muted-foreground">Drag fields here from the left panel or click a field type to add it.</p>
                          </div>
                        ) : (
                          fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="border rounded-md p-4 bg-card flex items-start justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <div {...provided.dragHandleProps} className="cursor-move mr-2">
                                        <MoveVertical className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <div className="flex items-center">
                                          {getFieldIcon(field.type)}
                                          <span className="font-medium">{field.label}</span>
                                          {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </div>
                                        <span className="text-sm text-muted-foreground capitalize">{field.type}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openFieldEditor(field)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                        />
                                      </svg>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => duplicateField(field)}
                                    >
                                      <Copy className="h-5 w-5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeField(field.id)}
                                    >
                                      <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {fields.length === 0 && (
                  <div className="mt-4 flex justify-center">
                    <Button onClick={() => addField('text')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Field
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Field Editor Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <FieldEditor 
              field={editingField} 
              onSave={updateField} 
              onCancel={() => setEditingField(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface FieldEditorProps {
  field: FormField;
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onSave, onCancel }) => {
  const [editedField, setEditedField] = useState<FormField>({ ...field });
  const [activeTab, setActiveTab] = useState("basic");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedField({ ...editedField, [name]: value });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setEditedField({ ...editedField, [name]: checked });
  };

  const handleOptionsChange = (value: string) => {
    // Convert comma-separated string to array
    const options = value.split(',').map(option => option.trim()).filter(Boolean);
    setEditedField({ ...editedField, options });
  };

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedField({
      ...editedField,
      validation: {
        ...editedField.validation,
        [name]: value === '' ? undefined : name === 'pattern' ? value : Number(value)
      }
    });
  };

  const handleSave = () => {
    onSave(editedField);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="label">Field Label</Label>
            <Input
              id="label"
              name="label"
              value={editedField.label}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              name="placeholder"
              value={editedField.placeholder || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={editedField.required}
              onCheckedChange={(checked) => 
                handleCheckboxChange('required', !!checked)
              }
            />
            <Label htmlFor="required">Required field</Label>
          </div>
          
          {(editedField.type === 'select' || editedField.type === 'multiselect' || editedField.type === 'radio') && (
            <div>
              <Label htmlFor="options">Options (comma separated)</Label>
              <Textarea
                id="options"
                value={editedField.options?.join(', ') || ''}
                onChange={(e) => handleOptionsChange(e.target.value)}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}
          
          {(editedField.type === 'text' || editedField.type === 'textarea' || editedField.type === 'number') && (
            <div>
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                name="defaultValue"
                value={editedField.defaultValue || ''}
                onChange={handleChange}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="validation" className="space-y-4">
          {(editedField.type === 'text' || editedField.type === 'textarea' || editedField.type === 'email') && (
            <>
              <div>
                <Label htmlFor="minLength">Minimum Length</Label>
                <Input
                  id="minLength"
                  name="minLength"
                  type="number"
                  value={editedField.validation?.minLength || ''}
                  onChange={handleValidationChange}
                />
              </div>
              
              <div>
                <Label htmlFor="maxLength">Maximum Length</Label>
                <Input
                  id="maxLength"
                  name="maxLength"
                  type="number"
                  value={editedField.validation?.maxLength || ''}
                  onChange={handleValidationChange}
                />
              </div>
            </>
          )}
          
          {editedField.type === 'number' && (
            <>
              <div>
                <Label htmlFor="min">Minimum Value</Label>
                <Input
                  id="min"
                  name="min"
                  type="number"
                  value={editedField.validation?.min || ''}
                  onChange={handleValidationChange}
                />
              </div>
              
              <div>
                <Label htmlFor="max">Maximum Value</Label>
                <Input
                  id="max"
                  name="max"
                  type="number"
                  value={editedField.validation?.max || ''}
                  onChange={handleValidationChange}
                />
              </div>
            </>
          )}
          
          {(editedField.type === 'text' || editedField.type === 'email' || editedField.type === 'tel') && (
            <div>
              <Label htmlFor="pattern">Pattern (RegEx)</Label>
              <Input
                id="pattern"
                name="pattern"
                value={editedField.validation?.pattern || ''}
                onChange={handleValidationChange}
                placeholder="e.g. ^[A-Za-z0-9]+$"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="customMessage">Custom Error Message</Label>
            <Input
              id="customMessage"
              name="customMessage"
              value={editedField.validation?.customMessage || ''}
              onChange={(e) => {
                setEditedField({
                  ...editedField,
                  validation: {
                    ...editedField.validation,
                    customMessage: e.target.value
                  }
                });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
};

const renderFieldPreview = (field: FormField) => {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <Input
          type={field.type}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
        />
      );
    case 'textarea':
      return (
        <Textarea
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
        />
      );
    case 'select':
      return (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option, i) => (
              <SelectItem key={i} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <Checkbox id={`preview-${field.id}`} />
          <Label htmlFor={`preview-${field.id}`}>{field.defaultValue || field.placeholder || 'Yes'}</Label>
        </div>
      );
    case 'date':
      return <Input type="date" />;
    case 'radio':
      return (
        <div className="space-y-2">
          {field.options?.map((option, i) => (
            <div key={i} className="flex items-center space-x-2">
              <input type="radio" id={`radio-${field.id}-${i}`} name={`radio-${field.id}`} className="h-4 w-4" />
              <Label htmlFor={`radio-${field.id}-${i}`}>{option}</Label>
            </div>
          ))}
        </div>
      );
    default:
      return <Input placeholder={field.placeholder} />;
  }
};

export default FormBuilder;
