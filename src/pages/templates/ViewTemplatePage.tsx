
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { FormBuilderService } from '@/components/FormBuilder/FormBuilderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileEdit, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import DynamicForm from '@/components/FormBuilder/DynamicForm';

const ViewTemplatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("preview");

  const { data: template, isLoading } = useQuery({
    queryKey: ['form-template', id],
    queryFn: () => id ? FormBuilderService.getFormTemplateById(id) : null,
    enabled: !!id,
  });

  const handleFormSubmit = (data: any) => {
    toast.success("Form submitted successfully");
    console.log("Form data:", data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">Template not found</h3>
          <p className="text-muted-foreground mb-4">
            The template you are looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/templates')} variant="outline">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{template.name} | Health Portal</title>
      </Helmet>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/templates')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{template.name}</h1>
                <Badge variant={template.isPublished ? "success" : "secondary"}>
                  {template.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/templates/edit/${template.id}`)}
            variant="outline"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <p>{template.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p>{format(new Date(template.createdAt), 'PPP')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p>{format(new Date(template.updatedAt), 'PPP')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fields</h3>
                  <p>{template.fields.length} fields</p>
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Field Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(template.fields.map(field => field.type))).map(type => (
                      <Badge key={type} variant="outline" className="capitalize">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template View</CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview" className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Form
                      </TabsTrigger>
                      <TabsTrigger value="json" className="flex items-center">
                        <Code className="h-4 w-4 mr-2" />
                        JSON Structure
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <TabsContent value="preview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DynamicForm
                        template={template}
                        onSubmit={handleFormSubmit}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="json">
                  <div className="p-4 bg-muted rounded-md">
                    <pre className="text-sm overflow-auto max-h-[500px]">
                      {JSON.stringify(template, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewTemplatePage;
