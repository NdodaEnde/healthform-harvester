import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import DocumentUploader from '@/components/DocumentUploader';
import BatchDocumentUploader from '@/components/BatchDocumentUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrphanedDocumentFixer } from '@/components/OrphanedDocumentFixer';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Upload, Trash2, CheckCircle, AlertCircle, Eye, Filter, Search, LayoutGrid, LayoutList, Shield, Lock, Database, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageCleanupUtility } from '@/components/StorageCleanupUtility';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';
type ViewMode = 'card' | 'list';

const DocumentsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCleanupTools, setShowCleanupTools] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [itemsPerPage] = useState(9);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  // Get current page from URL search params, default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const { 
    currentOrganization, 
    currentClient,
    isServiceProvider,
    getEffectiveOrganizationId
  } = useOrganization();

  // Get the effective organization ID (either client organization if selected, or current organization)
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Debug logging to understand the filtering context
  React.useEffect(() => {
    console.log('📊 DocumentsPage Debug Info:');
    console.log('Current Organization:', currentOrganization);
    console.log('Current Client:', currentClient);
    console.log('Effective Organization ID:', organizationId);
    console.log('Is Service Provider:', isServiceProvider());
    console.log('Context Label:', contextLabel);
    console.log('Environment:', window.location.hostname);
  }, [currentOrganization, currentClient, organizationId, isServiceProvider, contextLabel]);

  // Fetch all documents to get unique document types for filter dropdown
  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents', organizationId],
    queryFn: async () => {
      console.log('🔍 Fetching all documents for organization:', organizationId);
      
      let query = supabase
        .from('documents')
        .select('document_type');
      
      if (currentClient && isServiceProvider()) {
        console.log('📋 Filtering by client organization:', currentClient.id);
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        console.log('🏢 Filtering by organization:', organizationId);
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('❌ Error fetching all documents:', error);
        throw error;
      }
      
      console.log('📄 All documents count:', data?.length || 0);
      return data || [];
    },
    enabled: !!organizationId
  });

  // Extract unique document types
  const uniqueDocumentTypes = React.useMemo(() => {
    if (!allDocuments) return [];
    const types = allDocuments
      .map(doc => doc.document_type)
      .filter((type, index, self) => 
        type !== null && self.indexOf(type) === index
      );
    return types;
  }, [allDocuments]);

  // Main documents query with filtering and pagination
  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', organizationId, statusFilter, documentTypeFilter, searchTerm, currentPage],
    queryFn: async () => {
      console.log('🔍 Fetching documents with filters:');
      console.log('Organization ID:', organizationId);
      console.log('Status Filter:', statusFilter);
      console.log('Document Type Filter:', documentTypeFilter);
      console.log('Search Term:', searchTerm);
      console.log('Current Page:', currentPage);
      
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' });
      
      // Apply organization/client filter
      if (currentClient && isServiceProvider()) {
        console.log('🎯 Applying client filter:', currentClient.id);
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        console.log('🎯 Applying organization filter:', organizationId);
        query = query.eq('organization_id', organizationId);
      } else {
        console.log('⚠️ No organization context - this might cause issues');
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply document type filter
      if (documentTypeFilter !== 'all') {
        query = query.eq('document_type', documentTypeFilter);
      }
      
      // Apply search filter on file name
      if (searchTerm) {
        query = query.ilike('file_name', `%${searchTerm}%`);
      }
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching documents:', error);
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive"
        });
        throw new Error(error.message);
      }

      console.log('📊 Query Results:');
      console.log('Documents found:', data?.length || 0);
      console.log('Total count:', count);
      console.log('Sample documents:', data?.slice(0, 3));

      return {
        documents: data?.map(doc => ({
          ...doc, 
          reviewStatus: localStorage.getItem(`doc-review-${doc.id}`) as ReviewStatus || 'not-reviewed',
          reviewNote: localStorage.getItem(`doc-review-note-${doc.id}`) || ''
        })) || [],
        totalCount: count || 0
      };
    },
    enabled: !!organizationId
  });

  const totalPages = Math.ceil((documents?.totalCount || 0) / itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', '1');
      return newParams;
    });
  }, [searchTerm, statusFilter, documentTypeFilter, setSearchParams]);

  // Enhanced delete handler function
  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`);
    
    if (!confirmed) return;

    // Add document to deleting set to show loading state
    setDeletingDocuments(prev => new Set(prev).add(documentId));

    try {
      // First, get the document to access its file path for storage cleanup
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        toast({
          title: "Error",
          description: "Failed to fetch document details",
          variant: "destructive"
        });
        return;
      }

      // Delete from storage if file exists
      if (document?.file_path) {
        console.log('Deleting file from storage:', document.file_path);
        const { error: storageError } = await supabase.storage
          .from('medical-documents')
          .remove([document.file_path]);
        
        if (storageError) {
          console.warn('Warning: Could not delete file from storage:', storageError);
          // Continue with database deletion even if storage fails
        } else {
          console.log('File deleted from storage successfully');
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) {
        console.error('Error deleting document:', deleteError);
        toast({
          title: "Error deleting document",
          description: deleteError.message,
          variant: "destructive"
        });
        return;
      }

      // Clean up local storage review data
      localStorage.removeItem(`doc-review-${documentId}`);
      localStorage.removeItem(`doc-review-note-${documentId}`);

      // Refresh the documents list
      refetch();

      toast({
        title: "Document deleted",
        description: `"${fileName}" has been successfully deleted`,
      });

      console.log('Document deleted successfully:', documentId);

    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the document",
        variant: "destructive"
      });
    } finally {
      // Remove document from deleting set
      setDeletingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleUploadComplete = () => {
    refetch();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  const handleViewDocument = (documentId: string) => {
    // Preserve current page when navigating to document details
    navigate(`/documents/${documentId}?returnPage=${currentPage}`);
  };

  const updateDocumentReviewStatus = (documentId: string, reviewStatus: ReviewStatus, reviewNote?: string) => {
    localStorage.setItem(`doc-review-${documentId}`, reviewStatus);
    if (reviewNote) {
      localStorage.setItem(`doc-review-note-${documentId}`, reviewNote);
    }
    
    refetch();
    
    toast({
      title: "Review status updated",
      description: `Document has been marked as ${reviewStatus.replace('-', ' ')}`
    });
  };

  const getReviewStatusBadge = (reviewStatus: ReviewStatus | undefined) => {
    if (!reviewStatus || reviewStatus === 'not-reviewed') {
      return <Badge variant="outline" className="text-xs">Not Reviewed</Badge>;
    } else if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600 text-white">Reviewed</Badge>;
    } else if (reviewStatus === 'needs-correction') {
      return <Badge variant="destructive" className="text-xs">Needs Correction</Badge>;
    }
  };

  // Calculate review statistics
  const notReviewedCount = documents?.documents.filter(doc => 
    !doc.reviewStatus || doc.reviewStatus === 'not-reviewed'
  ).length || 0;
  
  const reviewedCount = documents?.documents.filter(doc => 
    doc.reviewStatus === 'reviewed'
  ).length || 0;
  
  const needsCorrectionCount = documents?.documents.filter(doc => 
    doc.reviewStatus === 'needs-correction'
  ).length || 0;

  // Only show upload button if we have an organization context
  const canUpload = !!organizationId;

  // Function to handle page changes with URL updates
  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', page.toString());
      return newParams;
    });
  };

  // Custom pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return (
      <div className="mt-8">
        <div className="flex items-center justify-center space-x-2">
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* First page */}
          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}

          {/* Page numbers */}
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => {
            const page = startPage + i;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            );
          })}

          {/* Last page */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-2">
          Page {currentPage} of {totalPages} ({documents?.totalCount || 0} total documents)
        </p>
      </div>
    );
  };
  
  // Render document card with delete functionality
  const renderDocumentCard = (document: any) => {
    const isDeleting = deletingDocuments.has(document.id);
    
    return (
      <Card key={document.id} className={isDeleting ? 'opacity-50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{document.file_name}</CardTitle>
            </div>
            <div>
              {getReviewStatusBadge(document.reviewStatus)}
            </div>
          </div>
          <CardDescription>Uploaded on {new Date(document.created_at).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                document.status === 'processed' 
                  ? 'bg-green-100 text-green-800' 
                  : document.status === 'processing' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type:</span>
              <span className="text-sm">{document.document_type || 'Unknown'}</span>
            </div>
            {document.client_organization_id && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Client:</span>
                <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  For client
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              onClick={() => handleViewDocument(document.id)} 
              variant="default"
              disabled={isDeleting}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => updateDocumentReviewStatus(document.id, 'reviewed')}
                    disabled={isDeleting}
                  >
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as reviewed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => updateDocumentReviewStatus(document.id, 'needs-correction')}
                    disabled={isDeleting}
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as needs correction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* DELETE BUTTON */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 hover:bg-destructive/10"
                    onClick={() => handleDeleteDocument(document.id, document.file_name)}
                    disabled={isDeleting}
                  >
                    <Trash2 className={`h-5 w-5 text-destructive ${isDeleting ? 'animate-pulse' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDeleting ? 'Deleting...' : 'Delete document'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render document list item with delete functionality
  const renderDocumentListItem = (document: any) => {
    const isDeleting = deletingDocuments.has(document.id);
    
    return (
      <div key={document.id} className={`flex items-center justify-between p-4 border rounded-lg mb-2 hover:bg-accent/10 transition-colors ${isDeleting ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-4 flex-1">
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium truncate">{document.file_name}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap mr-2">
              {new Date(document.created_at).toLocaleString()}
            </span>
            
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              document.status === 'processed' 
                ? 'bg-green-100 text-green-800' 
                : document.status === 'processing' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </span>
            
            {document.document_type && (
              <Badge variant="secondary" className="capitalize">
                {document.document_type.replace(/_/g, ' ')}
              </Badge>
            )}
            
            {getReviewStatusBadge(document.reviewStatus)}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => handleViewDocument(document.id)} 
              variant="outline" 
              size="sm"
              disabled={isDeleting}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateDocumentReviewStatus(document.id, 'reviewed')}
                    disabled={isDeleting}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as reviewed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateDocumentReviewStatus(document.id, 'needs-correction')}
                    disabled={isDeleting}
                  >
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as needs correction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* DELETE BUTTON */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10"
                    onClick={() => handleDeleteDocument(document.id, document.file_name)}
                    disabled={isDeleting}
                  >
                    <Trash2 className={`h-4 w-4 text-destructive ${isDeleting ? 'animate-pulse' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDeleting ? 'Deleting...' : 'Delete document'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {contextLabel ? `Viewing documents for ${contextLabel}` : "Manage your documents"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setShowCleanupTools(prev => !prev)} 
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            <span>Cleanup Tools</span>
          </Button>
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setShowUploadDialog(true)}
            disabled={!canUpload}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>
      
      {/* OrphanedDocumentFixer */}
      <div className="mb-6">
        <OrphanedDocumentFixer />
      </div>
      
      {/* Document Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentClient 
                ? `Upload Document for ${currentClient.name}` 
                : "Upload Document"}
            </DialogTitle>
          </DialogHeader>
          <DocumentUploader 
            onUploadComplete={handleUploadComplete} 
            organizationId={currentOrganization?.id}
            clientOrganizationId={currentClient?.id}
          />
        </DialogContent>
      </Dialog>
      
      {/* Show cleanup tools if enabled */}
      {showCleanupTools && (
        <div className="mb-6">
          <StorageCleanupUtility />
        </div>
      )}
      
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="uploads">Upload Documents</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          {!organizationId ? (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to view documents</p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-destructive">Error: {(error as Error).message}</p>
            </div>
          ) : documents && documents.documents.length > 0 ? (
            <>
              {/* Filters and Search */}
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search documents by name..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on new search
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Select 
                    value={statusFilter} 
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1); // Reset to first page on new filter
                    }}
                  >
                    <SelectTrigger>
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Status</span>
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select 
                    value={documentTypeFilter} 
                    onValueChange={(value) => {
                      setDocumentTypeFilter(value);
                      setCurrentPage(1); // Reset to first page on new filter
                    }}
                  >
                    <SelectTrigger>
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Document Type</span>
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueDocumentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* View toggle and review status summary */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && setViewMode(value as ViewMode)}
                  className="border rounded-md p-1"
                >
                  <ToggleGroupItem value="card" aria-label="Card View">
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Cards</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List View">
                    <LayoutList className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">List</span>
                  </ToggleGroupItem>
                </ToggleGroup>
                
                {documents.documents.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">Review Status:</span>
                    {notReviewedCount > 0 && <span className="text-muted-foreground">{notReviewedCount} not reviewed</span>}
                    {reviewedCount > 0 && <span className="text-green-500">{reviewedCount} reviewed</span>}
                    {needsCorrectionCount > 0 && <span className="text-red-500">{needsCorrectionCount} needs correction</span>}
                    <span className="ml-auto text-muted-foreground">
                      Showing {documents.documents.length} of {documents.totalCount} documents
                    </span>
                  </div>
                )}
              </div>
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={viewMode === 'card' 
                  ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-2"
                }
              >
                {documents.documents.map((document) => (
                  viewMode === 'card' 
                    ? renderDocumentCard(document)
                    : renderDocumentListItem(document)
                ))}
              </motion.div>
              
              {/* Pagination */}
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
              <Button 
                variant="outline" 
                className="mx-auto"
                onClick={() => setShowUploadDialog(true)}
                disabled={!canUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="uploads">
          {!organizationId ? (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to upload documents</p>
            </div>
          ) : (
            <div className="space-y-8">
              <BatchDocumentUploader 
                onUploadComplete={handleUploadComplete}
                organizationId={currentOrganization?.id}
                clientOrganizationId={currentClient?.id}
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Document Security
                </CardTitle>
                <CardDescription>
                  Your documents are protected with enterprise-grade security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">End-to-end encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">HIPAA compliant storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Access logging and monitoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Regular security audits</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Access Controls
                </CardTitle>
                <CardDescription>
                  Granular permissions and role-based access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Role-based permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Multi-factor authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Session management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Audit trail logging</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  Data Protection
                </CardTitle>
                <CardDescription>
                  Comprehensive backup and recovery systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Automated daily backups</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Geographic redundancy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Point-in-time recovery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Disaster recovery plan</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-orange-600" />
                  Compliance
                </CardTitle>
                <CardDescription>
                  Meeting healthcare and regulatory standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">HIPAA compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">SOC 2 Type II certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">GDPR compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Regular compliance audits</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
