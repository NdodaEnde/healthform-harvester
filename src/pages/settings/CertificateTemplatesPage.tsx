
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  fetchCertificateTemplates, 
  createCertificateTemplate, 
  updateCertificateTemplate,
  deleteCertificateTemplate,
  setDefaultTemplate,
  CertificateTemplate
} from '@/services/certificateTemplateService';
import { PlusCircle, Edit, Trash2, CheckCircle } from 'lucide-react';

// Schema for template form
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  template_data: z.object({
    header: z.string().optional(),
    footer: z.string().optional(),
    logo_position: z.enum(["left", "center", "right"]).default("left"),
    primary_color: z.string().default("#0f172a"),
    secondary_color: z.string().default("#64748b"),
    font: z.enum(["default", "serif", "sans-serif", "monospace"]).default("default"),
    include_signature: z.boolean().default(true),
    include_date: z.boolean().default(true),
    include_organization_details: z.boolean().default(true),
    custom_css: z.string().optional(),
  }),
  is_default: z.boolean().default(false)
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function CertificateTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      template_data: {
        header: "",
        footer: "",
        logo_position: "left",
        primary_color: "#0f172a",
        secondary_color: "#64748b",
        font: "default",
        include_signature: true,
        include_date: true,
        include_organization_details: true,
        custom_css: ""
      },
      is_default: false
    }
  });

  // Query to fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['certificateTemplates', organizationId],
    queryFn: () => fetchCertificateTemplates(organizationId || ''),
    enabled: !!organizationId,
  });

  // Mutation to create template
  const createMutation = useMutation({
    mutationFn: (template: Omit<CertificateTemplate, "id" | "created_at" | "updated_at">) => 
      createCertificateTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates', organizationId] });
      setIsCreateOpen(false);
      form.reset();
    }
  });

  // Mutation to update template
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<CertificateTemplate, "id" | "created_at" | "updated_at">> }) =>
      updateCertificateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates', organizationId] });
      setEditingTemplate(null);
      form.reset();
    }
  });

  // Mutation to delete template
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCertificateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates', organizationId] });
      toast({
        title: "Template deleted",
        description: "The certificate template has been deleted."
      });
    }
  });

  // Mutation to set default template
  const setDefaultMutation = useMutation({
    mutationFn: (templateId: string) => setDefaultTemplate(templateId, organizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateTemplates', organizationId] });
      toast({
        title: "Default template updated",
        description: "The default certificate template has been updated."
      });
    }
  });

  const handleCreateSubmit = (data: TemplateFormValues) => {
    if (!organizationId) return;
    
    createMutation.mutate({
      ...data,
      organization_id: organizationId
    });
  };

  const handleUpdateSubmit = (data: TemplateFormValues) => {
    if (!editingTemplate) return;
    
    updateMutation.mutate({
      id: editingTemplate.id,
      updates: data
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const openEditDialog = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      template_data: template.template_data,
      is_default: template.is_default
    });
  };

  const closeDialogs = () => {
    setIsCreateOpen(false);
    setEditingTemplate(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificate Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your organization's certificate templates.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You haven't created any certificate templates yet. Create your first template to start generating branded certificates.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className={template.is_default ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{template.name}</span>
                  {template.is_default && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Default</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDelete(template.id)}
                    disabled={template.is_default}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {!template.is_default && (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleSetDefault(template.id)}
                    className="ml-auto"
                  >
                    Set as Default
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Certificate Template</DialogTitle>
            <DialogDescription>
              Create a new template for your certificates. This will determine how your certificates look when generated.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g., Standard Certificate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="design">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="design" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template_data.logo_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo Position</FormLabel>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="template_data.primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="ml-2 flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.secondary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="ml-2 flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="template_data.font"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font</FormLabel>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="default">Default</option>
                          <option value="serif">Serif</option>
                          <option value="sans-serif">Sans Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="template_data.custom_css"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom CSS (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder=".certificate { ... }"
                            className="h-20 font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add custom CSS for advanced styling.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template_data.header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Certificate of Achievement"
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text to display at the top of the certificate.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="template_data.footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Valid for one year from date of issue."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text to display at the bottom of the certificate.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="template_data.include_signature"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Signature</FormLabel>
                            <FormDescription>
                              Display a signature line on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.include_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Date</FormLabel>
                            <FormDescription>
                              Display the issue date on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.include_organization_details"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Organization Details</FormLabel>
                            <FormDescription>
                              Display your organization's details on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as Default Template
                      </FormLabel>
                      <FormDescription>
                        This template will be used by default when generating certificates.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialogs}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Certificate Template</DialogTitle>
            <DialogDescription>
              Update your certificate template settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="E.g., Standard Certificate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="design">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value="design" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template_data.logo_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo Position</FormLabel>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="template_data.primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="ml-2 flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.secondary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <Input 
                              type="text" 
                              value={field.value} 
                              onChange={field.onChange}
                              className="ml-2 flex-1"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="template_data.font"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font</FormLabel>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="default">Default</option>
                          <option value="serif">Serif</option>
                          <option value="sans-serif">Sans Serif</option>
                          <option value="monospace">Monospace</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="template_data.custom_css"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom CSS (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder=".certificate { ... }"
                            className="h-20 font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add custom CSS for advanced styling.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template_data.header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Certificate of Achievement"
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text to display at the top of the certificate.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="template_data.footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Valid for one year from date of issue."
                            className="h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Text to display at the bottom of the certificate.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="template_data.include_signature"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Signature</FormLabel>
                            <FormDescription>
                              Display a signature line on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.include_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Date</FormLabel>
                            <FormDescription>
                              Display the issue date on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="template_data.include_organization_details"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Include Organization Details</FormLabel>
                            <FormDescription>
                              Display your organization's details on the certificate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={editingTemplate?.is_default}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as Default Template
                      </FormLabel>
                      <FormDescription>
                        {editingTemplate?.is_default 
                          ? "This is already set as the default template."
                          : "This template will be used by default when generating certificates."}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialogs}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
