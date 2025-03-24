
import React from 'react';
import { useForm, Controller, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { FormTemplate, FormField as FormFieldType } from './FormFieldTypes';

interface DynamicFormProps {
  template: FormTemplate;
  onSubmit: (data: FieldValues) => void;
  defaultValues?: FieldValues;
  isSubmitting?: boolean;
}

const createZodSchema = (template: FormTemplate) => {
  const schemaMap: Record<string, any> = {};

  template.fields.forEach((field) => {
    let fieldSchema: any = z.any();

    switch (field.type) {
      case 'text':
      case 'textarea':
        fieldSchema = z.string();
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength, 
            field.validation.customMessage || `Minimum ${field.validation.minLength} characters required`);
        }
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength, 
            field.validation.customMessage || `Maximum ${field.validation.maxLength} characters allowed`);
        }
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), 
            field.validation.customMessage || 'Invalid format');
        }
        break;
      case 'email':
        fieldSchema = z.string().email(field.validation?.customMessage || 'Invalid email address');
        break;
      case 'number':
        fieldSchema = z.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validation.min, 
            field.validation.customMessage || `Minimum value is ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validation.max, 
            field.validation.customMessage || `Maximum value is ${field.validation.max}`);
        }
        break;
      case 'select':
      case 'radio':
        fieldSchema = z.string();
        break;
      case 'multiselect':
        fieldSchema = z.array(z.string());
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'date':
        fieldSchema = z.string();
        break;
      case 'tel':
        fieldSchema = z.string();
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), 
            field.validation.customMessage || 'Invalid phone number format');
        }
        break;
      default:
        fieldSchema = z.string();
    }

    // Handle required fields
    if (field.required) {
      if (field.type === 'checkbox') {
        fieldSchema = fieldSchema.refine(val => val === true, {
          message: field.validation?.customMessage || 'This field is required',
        });
      } else if (field.type === 'multiselect') {
        fieldSchema = fieldSchema.min(1, field.validation?.customMessage || 'Please select at least one option');
      } else {
        fieldSchema = fieldSchema.nonempty(field.validation?.customMessage || 'This field is required');
      }
    } else {
      // Make non-required fields optional
      if (field.type === 'number') {
        fieldSchema = z.union([z.number(), z.literal('').transform(() => undefined)]).optional();
      } else if (field.type !== 'checkbox' && field.type !== 'multiselect') {
        fieldSchema = fieldSchema.optional();
      }
    }

    schemaMap[field.id] = fieldSchema;
  });

  return z.object(schemaMap);
};

const DynamicForm: React.FC<DynamicFormProps> = ({ 
  template, 
  onSubmit, 
  defaultValues = {}, 
  isSubmitting = false 
}) => {
  // Create a Zod schema based on the form template
  const formSchema = createZodSchema(template);
  
  // Prepare default values
  const preparedDefaultValues = template.fields.reduce((acc, field) => {
    if (defaultValues[field.id] !== undefined) {
      acc[field.id] = defaultValues[field.id];
    } else if (field.defaultValue !== undefined) {
      acc[field.id] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      acc[field.id] = false;
    } else if (field.type === 'multiselect') {
      acc[field.id] = [];
    } else {
      acc[field.id] = '';
    }
    return acc;
  }, {} as FieldValues);

  // Initialize the form
  const form = useForm<FieldValues>({
    resolver: zodResolver(formSchema),
    defaultValues: preparedDefaultValues,
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  // Render form fields based on field type
  const renderFormField = (field: FormFieldType) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type={field.type}
                    placeholder={field.placeholder}
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
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea
                    {...formField}
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
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type="number"
                    placeholder={field.placeholder}
                    onChange={(e) => {
                      const value = e.target.value;
                      formField.onChange(value === '' ? '' : Number(value));
                    }}
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
                <FormLabel>{field.label}</FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
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
                  <FormLabel>{field.label}</FormLabel>
                  {field.placeholder && (
                    <FormDescription>{field.placeholder}</FormDescription>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'date':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    {...formField}
                    type="date"
                  />
                </FormControl>
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
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`${field.id}-${option}`}
                          checked={formField.value === option}
                          onChange={() => formField.onChange(option)}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`${field.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </div>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {template.fields.map(renderFormField)}
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DynamicForm;
