
export interface FixedTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fixed';
  component: string; // Component name to render
  preview: string; // Preview image or description
}

export interface ConfigurableTemplate {
  id: string;
  name: string;
  organization_id: string;
  template_data: any;
  is_default: boolean;
  category: 'configurable';
  created_at: string;
  updated_at: string;
}

export type Template = FixedTemplate | ConfigurableTemplate;
