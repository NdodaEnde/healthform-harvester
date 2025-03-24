
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormBuilderService } from './FormBuilderService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { FormTemplate } from './FormFieldTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileEdit, Eye, Plus, Trash2, Search, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const FormTemplateList: React.FC = () => {
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['formTemplates', organizationId],
    queryFn: () => FormBuilderService.getFormTemplates(organizationId),
    enabled: !!organizationId,
  });
  
  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => FormBuilderService.deleteFormTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates', organizationId] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });
  
  // Publish/Unpublish mutation
  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => 
      FormBuilderService.publishFormTemplate(id, publish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formTemplates', organizationId] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template status:', error);
      toast.error('Failed to update template status');
    },
  });
  
  const handleCreateTemplate = () => {
    navigate('/templates/edit/new');
  };
  
  const handleEditTemplate = (id: string) => {
    navigate(`/templates/edit/${id}`);
  };
  
  const handleViewTemplate = (id: string) => {
    navigate(`/templates/view/${id}`);
  };
  
  const handleDeleteTemplate = async (id: string) => {
    deleteMutation.mutate(id);
  };
  
  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    publishMutation.mutate({
      id,
      publish: !currentStatus,
    });
  };
  
  const filteredTemplates = templates
    .filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(template => 
      categoryFilter === 'all' || 
      template.category === categoryFilter
    )
    .filter(template =>
      statusFilter === 'all' ||
      (statusFilter === 'published' && template.isPublished) ||
      (statusFilter === 'draft' && !template.isPublished)
    );

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(templates.map(t => t.category || 'Uncategorized')));
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge variant={template.isPublished ? "success" : "secondary"}>
                        {template.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                      {template.category && (
                        <Badge variant="outline">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description || 'No description provided'}
                </p>
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <span>
                    Last updated: {format(new Date(template.updatedAt), 'PP')}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {template.fields.length} {template.fields.length === 1 ? 'field' : 'fields'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePublishToggle(template.id, template.isPublished)}
                  >
                    {template.isPublished ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Publish
                      </>
                    )}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the "{template.name}" template and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTemplate(template.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template.id)}
                  >
                    <FileEdit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try changing your search or filters'
              : 'Get started by creating your first form template'}
          </p>
          <Button onClick={handleCreateTemplate} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormTemplateList;
