
import { supabase } from '@/integrations/supabase/client';
import { FormTemplate } from './FormFieldTypes';

export const FormBuilderService = {
  async getFormTemplates(organizationId: string): Promise<FormTemplate[]> {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('organizationId', organizationId);
    
    if (error) {
      console.error('Error fetching form templates:', error);
      throw error;
    }
    
    return data as FormTemplate[];
  },
  
  async getFormTemplateById(id: string): Promise<FormTemplate | null> {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned (not found)
        return null;
      }
      console.error('Error fetching form template:', error);
      throw error;
    }
    
    return data as FormTemplate;
  },
  
  async saveFormTemplate(template: FormTemplate): Promise<FormTemplate> {
    // Update the updatedAt timestamp
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('form_templates')
      .upsert(updatedTemplate, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving form template:', error);
      throw error;
    }
    
    return data as FormTemplate;
  },
  
  async deleteFormTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting form template:', error);
      throw error;
    }
  },
  
  async publishFormTemplate(id: string, publish: boolean): Promise<FormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .update({ isPublished: publish, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error publishing form template:', error);
      throw error;
    }
    
    return data as FormTemplate;
  }
};
