
export type FieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'tel'
  | 'radio';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select, multiselect, radio
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customMessage?: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  category?: string;
}
