
import { supabase } from '@/integrations/supabase/client';
import { FormTemplate } from './FormFieldTypes';

export const FormBuilderService = {
  async getFormTemplates(organizationId: string): Promise<FormTemplate[]> {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .eq('organizationid', organizationId);
    
    if (error) {
      console.error('Error fetching form templates:', error);
      throw error;
    }
    
    // Map database field names to our model field names
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      organizationId: item.organizationid,
      fields: item.fields,
      createdAt: item.createdat,
      updatedAt: item.updatedat,
      isPublished: item.ispublished,
      category: item.category || undefined
    }));
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
    
    // Map database field names to our model field names
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      organizationId: data.organizationid,
      fields: data.fields,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      isPublished: data.ispublished,
      category: data.category || undefined
    };
  },
  
  async saveFormTemplate(template: FormTemplate): Promise<FormTemplate> {
    // Update the updatedAt timestamp
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString()
    };
    
    // Map our model field names to database field names
    const dbTemplate = {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      organizationid: updatedTemplate.organizationId,
      fields: updatedTemplate.fields,
      createdat: updatedTemplate.createdAt,
      updatedat: updatedTemplate.updatedAt,
      ispublished: updatedTemplate.isPublished,
      category: updatedTemplate.category
    };
    
    const { data, error } = await supabase
      .from('form_templates')
      .upsert(dbTemplate, { onConflict: 'id' })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving form template:', error);
      throw error;
    }
    
    // Map database field names back to our model field names
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      organizationId: data.organizationid,
      fields: data.fields,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      isPublished: data.ispublished,
      category: data.category || undefined
    };
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
      .update({ 
        ispublished: publish, 
        updatedat: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error publishing form template:', error);
      throw error;
    }
    
    // Map database field names to our model field names
    return {
      id: data.id,
      name: data.name,
      description: data.description || undefined,
      organizationId: data.organizationid,
      fields: data.fields,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
      isPublished: data.ispublished,
      category: data.category || undefined
    };
  }
};
