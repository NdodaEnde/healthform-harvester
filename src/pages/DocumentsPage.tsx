
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentUploader from '@/components/DocumentUploader';
import BatchDocumentUploader from '@/components/BatchDocumentUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Upload, Trash2, CheckCircle, AlertCircle, Eye, Filter, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { StorageCleanupUtility } from '@/components/StorageCleanupUtility';

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

const DocumentsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCleanupTools, setShowCleanupTools] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const navigate = useNavigate();
  
  const { 
    currentOrganization, 
    currentClient,
    isServiceProvider,
    getEffectiveOrganizationId
  } = useOrganization();

  // Get the effective organization ID (either client organization if selected, or current organization)
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Fetch all documents to get unique document types for filter dropdown
  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('document_type');
      
      if (currentClient && isServiceProvider()) {
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
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
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' });
      
      // Apply organization/client filter
      if (currentClient && isServiceProvider()) {
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
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
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive"
        });
        throw new Error(error.message);
      }

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

  const handleUploadComplete = () => {
    refetch();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly.",
    });
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
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

  // Function to generate pagination links
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          isActive={currentPage === 1} 
          onClick={() => setCurrentPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // If there are many pages, add ellipsis after first page
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i} 
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // If there are many pages, add ellipsis before last page
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if it's not the first page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            isActive={currentPage === totalPages} 
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
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
              
              {/* Review status summary */}
              {documents.documents.length > 0 && (
                <div className="mb-6 flex items-center gap-4 text-sm">
                  <span className="font-medium">Review Status:</span>
                  {notReviewedCount > 0 && <span className="text-muted-foreground">{notReviewedCount} not reviewed</span>}
                  {reviewedCount > 0 && <span className="text-green-500">{reviewedCount} reviewed</span>}
                  {needsCorrectionCount > 0 && <span className="text-red-500">{needsCorrectionCount} needs correction</span>}
                  <span className="ml-auto text-muted-foreground">
                    Showing {documents.documents.length} of {documents.totalCount} documents
                  </span>
                </div>
              )}
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {documents.documents.map((document) => (
                  <Card key={document.id}>
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
                        <Button onClick={() => handleViewDocument(document.id)} variant="default">
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
                              >
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as needs correction</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </motion.div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} 
                        />
                      </PaginationItem>
                      
                      {generatePaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
            {/* Security content kept the same */}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
