
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUploader from "@/components/DocumentUploader";
import BatchDocumentUploader from "@/components/BatchDocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Upload, Trash2, CheckCircle, AlertCircle, Eye, Filter, SortDesc, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string | null;
  status: string;
  created_at: string;
  organization_id: string | null;
  client_organization_id: string | null;
  processed_at: string | null;
  extracted_data: any;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
}

const DocumentsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const navigate = useNavigate();
  const { 
    currentOrganization, 
    currentClient,
    isServiceProvider,
    getEffectiveOrganizationId
  } = useOrganization();

  // Get the effective organization ID
  const organizationId = getEffectiveOrganizationId();
  const contextLabel = currentClient ? currentClient.name : currentOrganization?.name;

  // Fetch documents with filters and pagination
  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', organizationId, currentPage, itemsPerPage, searchTerm, documentTypeFilter, statusFilter, sortField, sortOrder],
    queryFn: async () => {
      console.log('Fetching documents with filters:', {
        organizationId,
        page: currentPage,
        itemsPerPage,
        searchTerm,
        documentTypeFilter,
        statusFilter,
        sortField,
        sortOrder
      });
      
      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' });
      
      // Filter by organization context
      if (currentClient && isServiceProvider()) {
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      // Apply document type filter
      if (documentTypeFilter !== 'all') {
        query = query.eq('document_type', documentTypeFilter);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply search filter
      if (searchTerm) {
        query = query.ilike('file_name', `%${searchTerm}%`);
      }
      
      // Apply sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) {
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive"
        });
        throw new Error(error.message);
      }
      
      // Enhance with review status from localStorage
      const enhancedData = data?.map(doc => ({
        ...doc,
        reviewStatus: localStorage.getItem(`doc-review-${doc.id}`) as ReviewStatus || 'not-reviewed',
        reviewNote: localStorage.getItem(`doc-review-note-${doc.id}`) || ''
      })) || [];
      
      return {
        documents: enhancedData,
        totalCount: count || 0
      };
    },
    enabled: !!organizationId
  });

  const totalPages = documents ? Math.ceil(documents.totalCount / itemsPerPage) : 0;

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

  const getDocumentTypeOptions = () => {
    return [
      { label: "All Types", value: "all" },
      { label: "Certificate of Fitness", value: "certificate-fitness" },
      { label: "Medical Questionnaire", value: "medical-questionnaire" },
      { label: "Medical Report", value: "medical-report" },
      { label: "Audiogram", value: "audiogram" },
      { label: "Spirometry", value: "spirometry" },
      { label: "X-Ray Report", value: "xray-report" },
      { label: "Other", value: "other" }
    ];
  };

  const getStatusOptions = () => {
    return [
      { label: "All Statuses", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "Processing", value: "processing" },
      { label: "Processed", value: "processed" },
      { label: "Error", value: "error" }
    ];
  };

  const renderPagination = () => {
    if (!documents || documents.totalCount === 0) return null;
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <span className="flex h-9 w-9 items-center justify-center">...</span>
                </PaginationItem>
              )}
            </>
          )}
          
          {pageNumbers.map(number => (
            <PaginationItem key={number}>
              <PaginationLink 
                isActive={currentPage === number}
                onClick={() => setCurrentPage(number)}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <span className="flex h-9 w-9 items-center justify-center">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Calculate review statistics if documents exist
  const reviewStats = documents?.documents ? {
    notReviewed: documents.documents.filter(doc => 
      !doc.reviewStatus || doc.reviewStatus === 'not-reviewed'
    ).length || 0,
    
    reviewed: documents.documents.filter(doc => 
      doc.reviewStatus === 'reviewed'
    ).length || 0,
    
    needsCorrection: documents.documents.filter(doc => 
      doc.reviewStatus === 'needs-correction'
    ).length || 0
  } : { notReviewed: 0, reviewed: 0, needsCorrection: 0 };

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
            onClick={() => refetch()} 
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
          <Button 
            className="flex items-center gap-2" 
            onClick={() => setShowUploadDialog(true)}
            disabled={!organizationId}
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

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="documents">Document List</TabsTrigger>
          <TabsTrigger value="uploads">Batch Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          {!organizationId ? (
            <div className="text-center py-10 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No organization selected</h3>
              <p className="text-muted-foreground mb-4">Please select an organization to view documents</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                      <label className="text-sm font-medium mb-1 block">Search Documents</label>
                      <Input
                        placeholder="Search by filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="w-full md:w-1/5">
                      <label className="text-sm font-medium mb-1 block">Document Type</label>
                      <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDocumentTypeOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-1/5">
                      <label className="text-sm font-medium mb-1 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-1/5">
                      <label className="text-sm font-medium mb-1 block">Items Per Page</label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Items per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="25">25 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setSearchTerm('');
                        setDocumentTypeFilter('all');
                        setStatusFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      <Filter size={16} />
                      <span>Reset Filters</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review Stats */}
              {documents && documents.documents.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="px-3 py-1">
                    Total: {documents.totalCount} document{documents.totalCount !== 1 ? 's' : ''}
                  </Badge>
                  {reviewStats.notReviewed > 0 && (
                    <Badge variant="outline" className="px-3 py-1">
                      {reviewStats.notReviewed} not reviewed
                    </Badge>
                  )}
                  {reviewStats.reviewed > 0 && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 px-3 py-1">
                      {reviewStats.reviewed} reviewed
                    </Badge>
                  )}
                  {reviewStats.needsCorrection > 0 && (
                    <Badge variant="destructive" className="px-3 py-1">
                      {reviewStats.needsCorrection} need correction
                    </Badge>
                  )}
                </div>
              )}

              {/* Documents Table */}
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="py-10 text-center">
                  <p className="text-destructive">Error: {(error as Error).message}</p>
                </div>
              ) : documents && documents.documents.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[350px]">
                              <div className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (sortField === 'file_name') {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortField('file_name');
                                    setSortOrder('asc');
                                  }
                                }}
                              >
                                Document Name
                                {sortField === 'file_name' && (
                                  <SortDesc size={16} className={sortOrder === 'asc' ? 'transform rotate-180' : ''} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (sortField === 'document_type') {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortField('document_type');
                                    setSortOrder('asc');
                                  }
                                }}
                              >
                                Type
                                {sortField === 'document_type' && (
                                  <SortDesc size={16} className={sortOrder === 'asc' ? 'transform rotate-180' : ''} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (sortField === 'status') {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortField('status');
                                    setSortOrder('asc');
                                  }
                                }}
                              >
                                Status
                                {sortField === 'status' && (
                                  <SortDesc size={16} className={sortOrder === 'asc' ? 'transform rotate-180' : ''} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  if (sortField === 'created_at') {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                  } else {
                                    setSortField('created_at');
                                    setSortOrder('desc');
                                  }
                                }}
                              >
                                Date Uploaded
                                {sortField === 'created_at' && (
                                  <SortDesc size={16} className={sortOrder === 'asc' ? 'transform rotate-180' : ''} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead>Review Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.documents.map((doc) => (
                            <TableRow key={doc.id} className="hover:bg-muted/50">
                              <TableCell className="font-medium">{doc.file_name}</TableCell>
                              <TableCell>
                                {doc.document_type ? (
                                  <Badge variant="outline" className="capitalize">
                                    {doc.document_type.replace(/-/g, ' ')}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    doc.status === 'processed' ? 'default' : 
                                    doc.status === 'processing' ? 'secondary' : 
                                    doc.status === 'error' ? 'destructive' : 'outline'
                                  }
                                  className="capitalize"
                                >
                                  {doc.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(doc.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {getReviewStatusBadge(doc.reviewStatus)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleViewDocument(doc.id)}
                                        >
                                          <Eye size={16} />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View Document</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateDocumentReviewStatus(doc.id, 'reviewed')}
                                        >
                                          <CheckCircle size={16} className="text-green-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as Reviewed</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateDocumentReviewStatus(doc.id, 'needs-correction')}
                                        >
                                          <AlertCircle size={16} className="text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Needs Correction</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  
                  {/* Pagination */}
                  {renderPagination()}
                </motion.div>
              ) : (
                <div className="text-center py-10 border rounded-lg bg-background">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || documentTypeFilter !== 'all' || statusFilter !== 'all' 
                      ? "Try adjusting your filters" 
                      : "Upload your first document to get started"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mx-auto"
                    onClick={() => setShowUploadDialog(true)}
                    disabled={!organizationId}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              )}
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
      </Tabs>
    </div>
  );
};

export default DocumentsPage;
