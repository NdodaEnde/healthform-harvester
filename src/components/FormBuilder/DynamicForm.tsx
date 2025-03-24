
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FormTemplate, FieldType } from './FormFieldTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

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
  // Build Zod schema dynamically from the template
  const buildSchema = () => {
    const schema: Record<string, any> = {};

    template.fields.forEach((field) => {
      let fieldSchema: any = z.any();

      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string();
          
          if (field.validation?.minLength) {
            fieldSchema = fieldSchema.min(field.validation.minLength, {
              message: `Must be at least ${field.validation.minLength} characters`,
            });
          }
          
          if (field.validation?.maxLength) {
            fieldSchema = fieldSchema.max(field.validation.maxLength, {
              message: `Must be at most ${field.validation.maxLength} characters`,
            });
          }
          
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), {
              message: field.validation.customMessage || 'Invalid format',
            });
          }
          break;

        case 'email':
          fieldSchema = z.string().email({
            message: field.validation?.customMessage || 'Invalid email address',
          });
          break;

        case 'number':
          fieldSchema = z.coerce.number();
          
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min, {
              message: `Must be at least ${field.validation.min}`,
            });
          }
          
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max, {
              message: `Must be at most ${field.validation.max}`,
            });
          }
          break;

        case 'checkbox':
          fieldSchema = z.boolean();
          break;

        case 'select':
        case 'radio':
          fieldSchema = z.string();
          break;

        case 'multiselect':
          fieldSchema = z.array(z.string());
          break;

        case 'date':
          fieldSchema = z.string();
          break;

        case 'tel':
          fieldSchema = z.string();
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), {
              message: field.validation.customMessage || 'Invalid phone number',
            });
          }
          break;

        default:
          fieldSchema = z.string();
      }

      // Handle required fields
      if (field.required) {
        schema[field.id] = fieldSchema;
      } else {
        schema[field.id] = fieldSchema.optional();
      }
    });

    return z.object(schema);
  };

  const formSchema = buildSchema();
  
  // Set up form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
  };

  const renderField = (field: typeof template.fields[0]) => {
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
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                <FormControl>
                  <Input 
                    {...formField} 
                    placeholder={field.placeholder} 
                    type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
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
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
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

      case 'number':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
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

      case 'select':
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                <Select 
                  onValueChange={formField.onChange} 
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || 'Select an option'} />
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
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
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                        <label htmlFor={`${field.id}-${option}`}>{option}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
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
                <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
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

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {template.fields.map((field) => renderField(field))}
            </div>
          </CardContent>
        </Card>
        
        <Button type="submit" className="w-full">Submit</Button>
      </form>
    </Form>
  );
};

export default DynamicForm;
