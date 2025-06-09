import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Edit, Copy, Trash, FileText, Settings } from "lucide-react";
import CertificateTemplateEditor from "./CertificateTemplateEditor";
import CertificateTemplatePreview from "./CertificateTemplatePreview";
import { getOrganizationBranding } from "@/types/organization";
import { fixedTemplates } from "@/utils/templateRegistry";
import type { ConfigurableTemplate, FixedTemplate } from "@/types/template";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  is_default: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface CertificateTemplate {
  id: string;
  name: string;
  organization_id: string;
  template_data: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function CertificateTemplateManager() {
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState("fixed");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ConfigurableTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<FixedTemplate | ConfigurableTemplate | null>(null);
  const queryClient = useQueryClient();
  const organizationId = currentOrganization?.id;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      is_default: false,
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({
        name: "",
        is_default: false,
      });
      setIsEditMode(false);
      setCurrentTemplate(null);
    }
  }, [isDialogOpen, form]);

  // Set form values when editing existing template
  useEffect(() => {
    if (currentTemplate && isEditMode) {
      form.reset({
        name: currentTemplate.name,
        is_default: currentTemplate.is_default,
      });
    }
  }, [currentTemplate, isEditMode, form]);

  // Fetch configurable templates
  const { data: configurableTemplates, isLoading } = useQuery({
    queryKey: ["certificateTemplates", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .eq("organization_id", organizationId as any)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map(template => ({ ...template, category: 'configurable' as const })) as ConfigurableTemplate[];
    },
    enabled: !!organizationId,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues & { template_data: any }) => {
      if (!organizationId) throw new Error("No organization selected");
      
      // If this is the default template, unset any other default templates
      if (values.is_default) {
        await supabase
          .from("certificate_templates")
          .update({ is_default: false } as any)
          .eq("organization_id", organizationId as any);
      }
      
      // Create the new template
      const { data, error } = await supabase
        .from("certificate_templates")
        .insert({
          name: values.name,
          organization_id: organizationId,
          template_data: values.template_data,
          is_default: values.is_default,
        } as any)
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificateTemplates", organizationId] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Certificate template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (values: TemplateFormValues & { id: string, template_data: any }) => {
      if (!organizationId) throw new Error("No organization selected");
      
      // If this is the default template, unset any other default templates
      if (values.is_default) {
        await supabase
          .from("certificate_templates")
          .update({ is_default: false } as any)
          .eq("organization_id", organizationId as any)
          .neq("id", values.id as any);
      }
      
      // Update the template
      const { data, error } = await supabase
        .from("certificate_templates")
        .update({
          name: values.name,
          template_data: values.template_data,
          is_default: values.is_default,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", values.id as any)
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificateTemplates", organizationId] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Certificate template updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", templateId as any);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificateTemplates", organizationId] });
      toast({
        title: "Success",
        description: "Certificate template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: CertificateTemplate) => {
      if (!organizationId) throw new Error("No organization selected");
      
      const { data, error } = await supabase
        .from("certificate_templates")
        .insert({
          name: `${template.name} (Copy)`,
          organization_id: organizationId,
          template_data: template.template_data,
          is_default: false,
        } as any)
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificateTemplates", organizationId] });
      toast({
        title: "Success",
        description: "Certificate template duplicated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to duplicate template: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (editorData: any) => {
    const values = form.getValues();
    createTemplateMutation.mutate({
      ...values,
      template_data: editorData,
    });
  };

  const handleUpdateTemplate = (editorData: any) => {
    const values = form.getValues();
    if (!currentTemplate) return;
    
    updateTemplateMutation.mutate({
      id: currentTemplate.id,
      ...values,
      template_data: editorData,
    });
  };

  const handleDeleteTemplate = (template: CertificateTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
      
      // If we're deleting the selected template, clear the selection
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleEditTemplate = (template: ConfigurableTemplate) => {
    setCurrentTemplate(template);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDuplicateTemplate = (template: CertificateTemplate) => {
    duplicateTemplateMutation.mutate(template);
  };

  const handleSelectTemplate = (template: FixedTemplate | ConfigurableTemplate) => {
    setSelectedTemplate(template);
  };

  const handleNewTemplate = () => {
    setIsEditMode(false);
    setCurrentTemplate(null);
    setIsDialogOpen(true);
  };

  // Default template editor data
  const defaultTemplateData = {
    sections: [
      { title: "Patient Information", enabled: true },
      { title: "Medical Tests", enabled: true },
      { title: "Vision Tests", enabled: true },
      { title: "Fitness Declaration", enabled: true },
      { title: "Restrictions", enabled: true },
      { title: "Follow-up Actions", enabled: true },
    ],
    branding: {
      showLogo: true,
      showHeader: true,
      showFooter: true,
      useOrganizationColors: true,
    },
    layout: {
      pageSize: "A4",
      orientation: "portrait",
      margins: {
        top: "2.5cm",
        bottom: "2.5cm",
        left: "2.5cm",
        right: "2.5cm",
      },
    },
  };

  // Get organization branding using the helper function
  const organizationBranding = currentOrganization ? getOrganizationBranding(currentOrganization) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Certificate Templates</h2>
        <Button onClick={handleNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          New Custom Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fixed" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fixed Layout Templates
          </TabsTrigger>
          <TabsTrigger value="configurable" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Custom Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fixed" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Professional, pre-built templates ready to use immediately. Perfect for standardized documents.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fixedTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id 
                    ? "ring-2 ring-primary" 
                    : "hover:shadow-md"
                }`}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {template.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        Fixed Layout
                      </Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="h-32 bg-gray-50 dark:bg-gray-900 border rounded-md flex items-center justify-center">
                    <div className="text-sm text-muted-foreground">{template.preview}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configurable" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Custom templates with full control over sections, branding, and layout. Create your own designs.
          </p>
          
          {isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configurableTemplates?.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id 
                      ? "ring-2 ring-primary" 
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {template.name}
                        {template.is_default && (
                          <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </CardTitle>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(template);
                          }}
                          className="h-8 w-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-gray-50 dark:bg-gray-900 border rounded-md flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">Custom Template</div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!configurableTemplates || configurableTemplates.length === 0) && (
                <div className="col-span-full text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No custom templates yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first custom template to get started
                  </p>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Template
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">
            Preview: {selectedTemplate.name}
            {selectedTemplate.category === 'fixed' && (
              <Badge variant="outline" className="ml-2">Fixed Layout</Badge>
            )}
          </h3>
          {selectedTemplate.category === 'configurable' ? (
            <CertificateTemplatePreview 
              template={selectedTemplate} 
              organizationBranding={organizationBranding}
            />
          ) : (
            <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-muted-foreground text-center">
                {selectedTemplate.description}
              </p>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Fixed layout templates are used directly in document validation
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Certificate Template" : "Create Certificate Template"}
            </DialogTitle>
            <DialogDescription>
              Customize how certificates will be generated for patients
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Standard Medical Certificate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default template</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This template will be used by default when generating new certificates
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="my-4">
            <CertificateTemplateEditor
              initialData={isEditMode && currentTemplate ? currentTemplate.template_data : defaultTemplateData}
              onSave={isEditMode ? handleUpdateTemplate : handleCreateTemplate}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(() => {
                // The save is handled by the editor component
              })}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditMode ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
