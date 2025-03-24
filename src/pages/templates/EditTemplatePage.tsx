import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { FormBuilderService } from '@/components/FormBuilder/FormBuilderService';
import FormBuilder from '@/components/FormBuilder/FormBuilder';
import { FormTemplate } from '@/components/FormBuilder/FormFieldTypes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import TemplateUploader from '@/components/FormBuilder/TemplateUploader';

const EditTemplatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewTemplate = id === 'new';
  const [showUploader, setShowUploader] = useState(false);
  
  const { data: template, isLoading } = useQuery({
    queryKey: ['form-template', id],
    queryFn: () => id && !isNewTemplate
      ? FormBuilderService.getFormTemplateById(id)
      : null,
    enabled: !isNewTemplate && !!id,
  });

  const handleSave = (savedTemplate: FormTemplate) => {
    toast.success(
      isNewTemplate
        ? 'Template created successfully'
        : 'Template updated successfully'
    );
    navigate('/templates');
  };

  return (
    <>
      <Helmet>
        <title>
          {isNewTemplate ? 'Create Template' : 'Edit Template'} | Health Portal
        </title>
      </Helmet>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/templates')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewTemplate ? 'Create New Template' : 'Edit Template'}
            </h1>
            <p className="text-muted-foreground">
              {isNewTemplate
                ? 'Create a new form template for your organization'
                : 'Modify an existing form template'}
            </p>
          </div>
        </div>

        {isNewTemplate && (
          <div className="flex gap-4 mb-6">
            <Button 
              variant={!showUploader ? "default" : "outline"} 
              onClick={() => setShowUploader(false)}
              className="flex-1"
            >
              <FileText className="mr-2 h-5 w-5" />
              Build from Scratch
            </Button>
            <Button 
              variant={showUploader ? "default" : "outline"} 
              onClick={() => setShowUploader(true)}
              className="flex-1"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Existing Form
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : showUploader && isNewTemplate ? (
          <TemplateUploader onTemplateCreated={(newTemplate) => {
            toast.success('Template created from document successfully');
            navigate(`/templates/edit/${newTemplate.id}`);
          }} />
        ) : (
          <FormBuilder 
            initialTemplate={template as FormTemplate | undefined} 
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
};

export default EditTemplatePage;
