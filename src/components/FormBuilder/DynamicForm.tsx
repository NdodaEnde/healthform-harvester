
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormTemplate, FormField } from './FormFieldTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

interface DynamicFormProps {
  template: FormTemplate;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  template,
  initialData = {},
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically build a Zod schema based on the template fields
  const buildZodSchema = () => {
    const schemaObj: Record<string, any> = {};

    template.fields.forEach((field) => {
      let schema: any = z.any();

      switch (field.type) {
        case 'text':
        case 'textarea':
          schema = z.string();
          if (field.validation?.minLength) {
            schema = schema.min(field.validation.minLength, 
              field.validation.customMessage || `Minimum ${field.validation.minLength} characters required`);
          }
          if (field.validation?.maxLength) {
            schema = schema.max(field.validation.maxLength, 
              field.validation.customMessage || `Maximum ${field.validation.maxLength} characters allowed`);
          }
          if (field.validation?.pattern) {
            schema = schema.regex(new RegExp(field.validation.pattern), 
              field.validation.customMessage || 'Invalid format');
          }
          break;
        case 'email':
          schema = z.string().email(field.validation?.customMessage || 'Invalid email address');
          break;
        case 'number':
          schema = z.coerce.number();
          if (field.validation?.min !== undefined) {
            schema = schema.min(field.validation.min, 
              field.validation.customMessage || `Minimum value is ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined) {
            schema = schema.max(field.validation.max, 
              field.validation.customMessage || `Maximum value is ${field.validation.max}`);
          }
          break;
        case 'select':
          schema = z.string();
          break;
        case 'multiselect':
          schema = z.array(z.string());
          break;
        case 'checkbox':
          schema = z.boolean();
          break;
        case 'date':
          schema = z.string();
          break;
        case 'tel':
          schema = z.string();
          if (field.validation?.pattern) {
            schema = schema.regex(new RegExp(field.validation.pattern), 
              field.validation.customMessage || 'Invalid phone number format');
          }
          break;
        case 'radio':
          schema = z.string();
          break;
        default:
          schema = z.string();
      }

      // Handle required fields
      if (field.required) {
        if (['text', 'textarea', 'email', 'select', 'date', 'tel', 'radio'].includes(field.type)) {
          schema = schema.min(1, 'This field is required');
        } else if (field.type === 'multiselect') {
          schema = schema.min(1, 'Select at least one option');
        }
      } else {
        if (['text', 'textarea', 'email', 'select', 'date', 'tel', 'radio'].includes(field.type)) {
          schema = z.string().optional();
        } else if (field.type === 'number') {
          schema = z.coerce.number().optional();
        } else if (field.type === 'multiselect') {
          schema = z.array(z.string()).optional();
        } else if (field.type === 'checkbox') {
          schema = z.boolean().optional();
        }
      }

      schemaObj[field.id] = schema;
    });

    return z.object(schemaObj);
  };

  const schema = buildZodSchema();
  
  // Generate default values from template and initialData
  const generateDefaultValues = () => {
    const defaults: Record<string, any> = {};
    
    template.fields.forEach((field) => {
      // Use initialData if available, otherwise use field default value
      if (initialData && initialData[field.id] !== undefined) {
        defaults[field.id] = initialData[field.id];
      } else if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      } else {
        // Set appropriate type-based default values
        switch (field.type) {
          case 'checkbox':
            defaults[field.id] = false;
            break;
          case 'multiselect':
            defaults[field.id] = [];
            break;
          case 'number':
            defaults[field.id] = '';
            break;
          default:
            defaults[field.id] = '';
        }
      }
    });
    
    return defaults;
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: generateDefaultValues(),
  });

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      toast.success('Form submitted successfully');
      form.reset(generateDefaultValues());
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={field.type === 'date' ? 'date' : field.type}
                    placeholder={field.placeholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'number':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type="number"
                    placeholder={field.placeholder}
                    min={field.validation?.min}
                    max={field.validation?.max}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case 'textarea':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Textarea
                    {...formField}
                    placeholder={field.placeholder}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'select':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                  value={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'multiselect':
        // Note: This is a simplified implementation of multiselect
        // A more complete implementation would use a custom component with checkboxes
        return (
          <FormItem key={field.id} className="space-y-2">
            <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
            <FormControl>
              <div className="space-y-2 border rounded-md p-3">
                {field.options?.map((option, index) => (
                  <div className="flex items-center space-x-2" key={index}>
                    <Controller
                      name={field.id}
                      control={form.control}
                      render={({ field: formField }) => {
                        const values = formField.value || [];
                        return (
                          <Checkbox
                            checked={values.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                formField.onChange([...values, option]);
                              } else {
                                formField.onChange(values.filter((v: string) => v !== option));
                              }
                            }}
                          />
                        );
                      }}
                    />
                    <Label>{option}</Label>
                  </div>
                ))}
              </div>
            </FormControl>
            {form.formState.errors[field.id] && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors[field.id]?.message as string}
              </p>
            )}
          </FormItem>
        );
      
      case 'checkbox':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'radio':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="space-y-3">
                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    value={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option, index) => (
                      <div className="flex items-center space-x-2" key={index}>
                        <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                        <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          {template.fields.map((field) => renderField(field))}
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Submitting...
            </div>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DynamicForm;
