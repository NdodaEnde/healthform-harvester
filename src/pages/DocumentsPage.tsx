
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Eye, Filter, Search, CheckCircle, AlertCircle } from "lucide-react";
import DocumentUploader from "@/components/DocumentUploader";
import { Helmet } from "react-helmet";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ITEMS_PER_PAGE = 10;

const DocumentsPage = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [documentStatus, setDocumentStatus] = useState("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
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

  // Fetch documents
  const { data: allDocuments, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', organizationId, documentType, documentStatus, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*');
      
      // Filter by organization
      if (currentClient && isServiceProvider()) {
        query = query.eq('client_organization_id', currentClient.id);
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      // Filter by document type
      if (documentType !== "all") {
        query = query.eq('document_type', documentType);
      }
      
      // Filter by status
      if (documentStatus !== "all") {
        query = query.eq('status', documentStatus);
      }
      
      // Search by filename
      if (searchTerm) {
        query = query.ilike('file_name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching documents",
          description: error.message,
          variant: "destructive"
        });
        throw new Error(error.message);
      }

      return data?.map(doc => ({
        ...doc, 
        reviewStatus: localStorage.getItem(`doc-review-${doc.id}`) || 'not-reviewed',
        reviewNote: localStorage.getItem(`doc-review-note-${doc.id}`) || ''
      })) || [];
    },
    enabled: !!organizationId
  });

  // Calculate pagination
  const totalDocuments = allDocuments?.length || 0;
  const totalPages = Math.ceil(totalDocuments / ITEMS_PER_PAGE);
  
  // Get current page documents
  const documents = allDocuments ? allDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  ) : [];

  const handleUploadComplete = () => {
    refetch();
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded successfully",
      description: "Your document has been uploaded and will be processed shortly."
    });
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const selectAllDocuments = () => {
    if (documents && documents.length > 0) {
      if (selectedDocuments.length === documents.length) {
        setSelectedDocuments([]);
      } else {
        setSelectedDocuments(documents.map(doc => doc.id));
      }
    }
  };

  const updateDocumentReviewStatus = (documentId: string, reviewStatus: string) => {
    localStorage.setItem(`doc-review-${documentId}`, reviewStatus);
    refetch();
    toast({
      title: "Review status updated",
      description: `Document has been marked as ${reviewStatus.replace('-', ' ')}`
    });
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      // Clear selection when changing pages
      setSelectedDocuments([]);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)} 
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pageNumbers.map(page => (
            <PaginationItem key={page}>
              <PaginationLink 
                isActive={page === currentPage}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)} 
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const canUpload = !!organizationId;

  return (
    <div className="mt-4">
      <Helmet>
        <title>Documents</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {contextLabel ? `Manage documents for ${contextLabel}` : "Manage your documents"}
          </p>
        </div>
        <div>
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
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Document Type</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="certificate-fitness">Certificate of Fitness</SelectItem>
                  <SelectItem value="medical-questionnaire">Medical Questionnaire</SelectItem>
                  <SelectItem value="medical-report">Medical Report</SelectItem>
                  <SelectItem value="audiogram">Audiogram</SelectItem>
                  <SelectItem value="spirometry">Spirometry</SelectItem>
                  <SelectItem value="xray-report">X-Ray Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={documentStatus} onValueChange={setDocumentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setDocumentType("all");
                setDocumentStatus("all");
                setCurrentPage(1); // Reset to first page when filters are reset
              }}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>
              Documents
              {allDocuments && allDocuments.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {allDocuments.length}
                </Badge>
              )}
            </CardTitle>
            
            {documents && documents.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAllDocuments}
                >
                  {selectedDocuments.length === documents.length ? "Deselect All" : "Select All"}
                </Button>
                
                {selectedDocuments.length > 0 && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        selectedDocuments.forEach(id => 
                          updateDocumentReviewStatus(id, 'reviewed')
                        );
                      }}
                    >
                      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                      Mark Selected as Reviewed
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedDocuments.forEach(id => 
                          updateDocumentReviewStatus(id, 'needs-correction')
                        );
                      }}
                    >
                      <AlertCircle className="mr-1 h-4 w-4 text-red-500" />
                      Mark Selected as Needs Correction
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <CardDescription>
            {allDocuments && allDocuments.length > 0 
              ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(currentPage * ITEMS_PER_PAGE, totalDocuments)} of ${totalDocuments} documents` 
              : "No documents found matching your criteria"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-destructive">Error: {(error as Error).message}</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={selectedDocuments.length === documents.length && documents.length > 0}
                        onCheckedChange={selectAllDocuments}
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={() => toggleDocumentSelection(doc.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{doc.file_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc.document_type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            doc.status === 'processed' ? 'default' : 
                            doc.status === 'processing' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            doc.reviewStatus === 'reviewed' ? 'default' : 
                            doc.reviewStatus === 'needs-correction' ? 'destructive' : 
                            'outline'
                          }
                          className={
                            doc.reviewStatus === 'reviewed' ? 'bg-green-500 hover:bg-green-600' : 
                            doc.reviewStatus === 'needs-correction' ? '' : 
                            ''
                          }
                        >
                          {doc.reviewStatus === 'reviewed' ? 'Reviewed' :
                           doc.reviewStatus === 'needs-correction' ? 'Needs Correction' :
                           'Not Reviewed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDocument(doc.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateDocumentReviewStatus(doc.id, 'reviewed')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateDocumentReviewStatus(doc.id, 'needs-correction')}
                          >
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {renderPagination()}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-background">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || documentType !== "all" || documentStatus !== "all" 
                  ? "Try adjusting your filters to see more results" 
                  : "Upload your first document to get started"}
              </p>
              {!(searchTerm || documentType !== "all" || documentStatus !== "all") && (
                <Button 
                  variant="outline" 
                  className="mx-auto"
                  onClick={() => setShowUploadDialog(true)}
                  disabled={!canUpload}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;
