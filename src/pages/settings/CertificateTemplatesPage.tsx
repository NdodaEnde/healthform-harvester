import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCertificateTemplates, 
  createCertificateTemplate, 
  updateCertificateTemplate, 
  deleteCertificateTemplate,
  setDefaultTemplate,
  CertificateTemplate
} from '@/services/certificateTemplateService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Trash, Edit, Plus, Star, StarOff } from 'lucide-react';

type UpdateTemplateVariables = {
  id: string;
  name: string;
  is_default: boolean;
  template_data: {
    header: string;
    footer: string;
    logo_position: 'left' | 'center' | 'right';
    primary_color: string;
    secondary_color: string;
    include_signature: boolean;
    include_organization_details: boolean;
    font: string;
  };
};

const CertificateTemplatesPage = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id || '';
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [headerText, setHeaderText] = useState('Medical Certificate');
  const [footerText, setFooterText] = useState('');
  const [logoPosition, setLogoPosition] = useState<'left' | 'center' | 'right'>('center');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [secondaryColor, setSecondaryColor] = useState('#64748b');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeOrgDetails, setIncludeOrgDetails] = useState(true);
  const [font, setFont] = useState('default');
  const [isDefault, setIsDefault] = useState(false);
  
  const { data: templates, isLoading } = useQuery({
    queryKey: ['certificate-templates', orgId],
    queryFn: () => fetchCertificateTemplates(orgId),
    enabled: !!orgId,
  });
  
  const createMutation = useMutation({
    mutationFn: createCertificateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', orgId] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: (variables: UpdateTemplateVariables) => {
      return updateCertificateTemplate(variables.id, {
        name: variables.name,
        is_default: variables.is_default,
        template_data: variables.template_data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', orgId] });
      resetForm();
      setIsEditDialogOpen(false);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCertificateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', orgId] });
      toast({
        title: "Template Deleted",
        description: "Certificate template has been deleted.",
      });
    },
  });
  
  const setDefaultMutation = useMutation({
    mutationFn: ({ templateId, orgId }: { templateId: string; orgId: string }) => 
      setDefaultTemplate(templateId, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', orgId] });
    },
  });
  
  const resetForm = () => {
    setTemplateName('');
    setHeaderText('Medical Certificate');
    setFooterText('');
    setLogoPosition('center');
    setPrimaryColor('#0f172a');
    setSecondaryColor('#64748b');
    setIncludeSignature(true);
    setIncludeOrgDetails(true);
    setFont('default');
    setIsDefault(false);
    setCurrentTemplate(null);
  };
  
  const handleEditTemplate = (template: CertificateTemplate) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setHeaderText(template.template_data.header || 'Medical Certificate');
    setFooterText(template.template_data.footer || '');
    setLogoPosition(template.template_data.logo_position || 'center');
    setPrimaryColor(template.template_data.primary_color || '#0f172a');
    setSecondaryColor(template.template_data.secondary_color || '#64748b');
    setIncludeSignature(template.template_data.include_signature !== false);
    setIncludeOrgDetails(template.template_data.include_organization_details !== false);
    setFont(template.template_data.font || 'default');
    setIsDefault(template.is_default || false);
    setIsEditDialogOpen(true);
  };
  
  const handleCreateTemplate = () => {
    if (!orgId) return;
    
    const templateData = {
      name: templateName,
      organization_id: orgId,
      is_default: isDefault,
      template_data: {
        header: headerText,
        footer: footerText,
        logo_position: logoPosition,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        include_signature: includeSignature,
        include_organization_details: includeOrgDetails,
        font: font,
      },
    };
    
    createMutation.mutate(templateData as CertificateTemplate);
  };
  
  const handleUpdateTemplate = () => {
    if (!currentTemplate) return;
    
    const updateData: UpdateTemplateVariables = {
      id: currentTemplate.id,
      name: templateName,
      is_default: isDefault,
      template_data: {
        header: headerText,
        footer: footerText,
        logo_position: logoPosition,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        include_signature: includeSignature,
        include_organization_details: includeOrgDetails,
        font: font,
      }
    };
    
    updateMutation.mutate(updateData);
  };
  
  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const handleSetDefault = (templateId: string) => {
    if (!orgId) return;
    setDefaultMutation.mutate({ templateId, orgId });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Certificate Templates</h1>
          <p className="text-muted-foreground">Create and manage certificate templates for your organization.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Certificate Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Template Name</label>
                <input
                  id="name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="header" className="text-sm font-medium">Header Text</label>
                <input
                  id="header"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="footer" className="text-sm font-medium">Footer Text</label>
                <input
                  id="footer"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</label>
                  <input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full mt-1 h-10"
                  />
                </div>
                <div>
                  <label htmlFor="secondaryColor" className="text-sm font-medium">Secondary Color</label>
                  <input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full mt-1 h-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="logoPosition" className="text-sm font-medium">Logo Position</label>
                <select
                  id="logoPosition"
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as 'left' | 'center' | 'right')}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="font" className="text-sm font-medium">Font</label>
                <select
                  id="font"
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="default">Default (System Font)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="includeSignature"
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeSignature" className="text-sm font-medium">Include Signature Line</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="includeOrgDetails"
                  type="checkbox"
                  checked={includeOrgDetails}
                  onChange={(e) => setIncludeOrgDetails(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="includeOrgDetails" className="text-sm font-medium">Include Organization Details</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isDefault" className="text-sm font-medium">Set as Default Template</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTemplate} disabled={!templateName}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Certificate Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="edit-name" className="text-sm font-medium">Template Name</label>
                <input
                  id="edit-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-header" className="text-sm font-medium">Header Text</label>
                <input
                  id="edit-header"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div>
                <label htmlFor="edit-footer" className="text-sm font-medium">Footer Text</label>
                <input
                  id="edit-footer"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-primaryColor" className="text-sm font-medium">Primary Color</label>
                  <input
                    id="edit-primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full mt-1 h-10"
                  />
                </div>
                <div>
                  <label htmlFor="edit-secondaryColor" className="text-sm font-medium">Secondary Color</label>
                  <input
                    id="edit-secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full mt-1 h-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-logoPosition" className="text-sm font-medium">Logo Position</label>
                <select
                  id="edit-logoPosition"
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value as 'left' | 'center' | 'right')}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-font" className="text-sm font-medium">Font</label>
                <select
                  id="edit-font"
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="default">Default (System Font)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-includeSignature"
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="edit-includeSignature" className="text-sm font-medium">Include Signature Line</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-includeOrgDetails"
                  type="checkbox"
                  checked={includeOrgDetails}
                  onChange={(e) => setIncludeOrgDetails(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="edit-includeOrgDetails" className="text-sm font-medium">Include Organization Details</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="edit-isDefault"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="edit-isDefault" className="text-sm font-medium">Set as Default Template</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTemplate} disabled={!templateName}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id} className={template.is_default ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(template.id)}
                        className="h-8 w-8 p-0"
                      >
                        <StarOff className="h-4 w-4" />
                        <span className="sr-only">Set as Default</span>
                      </Button>
                    )}
                    {template.is_default && (
                      <div className="h-8 w-8 flex items-center justify-center">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {template.is_default && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full mr-2">Default</span>}
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Header:</span> {template.template_data.header || 'Medical Certificate'}
                  </div>
                  <div className="flex space-x-2 mb-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: template.template_data.primary_color || '#0f172a' }} />
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: template.template_data.secondary_color || '#64748b' }} />
                    <span className="text-xs">Colors</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      Logo: {template.template_data.logo_position || 'center'}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded-full">
                      Font: {template.template_data.font || 'default'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-muted-foreground mb-4">No certificate templates found. Create your first template to get started.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateTemplatesPage;
