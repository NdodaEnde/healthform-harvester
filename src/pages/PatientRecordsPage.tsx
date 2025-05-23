
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, safeQueryResult, safeDocumentAccess } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import PatientVisits from '@/components/PatientVisits';
import { OrphanedDocumentFixer } from '@/components/OrphanedDocumentFixer';
import DocumentUploader from '@/components/DocumentUploader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, RefreshCcw } from 'lucide-react';

const PatientRecordsPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { currentOrganization, currentClient } = useOrganization();
  const [patient, setPatient] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [visibleDocuments, setVisibleDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load patient data
  useEffect(() => {
    if (!patientId) return;
    
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        
        // Determine which organization ID to use
        const organizationId = currentClient?.id || currentOrganization?.id;
        if (!organizationId) {
          throw new Error('No organization context available');
        }
        
        // Fetch patient details
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (patientError) throw patientError;
        
        if (patientData) {
          setPatient(patientData);
          
          // Fetch related documents
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('*, certificates(*)')
            .eq('owner_id', patientId)
            .order('created_at', { ascending: false });
          
          if (documentsError) throw documentsError;
          
          // Map documents to ensure type safety
          const safeDocuments = (documentsData || []).map(doc => safeDocumentAccess(doc));
          setDocuments(safeDocuments);
          setVisibleDocuments(safeDocuments);
        }
      } catch (error) {
        console.error('Error fetching patient records:', error);
        toast.error('Failed to load patient records');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId, currentOrganization?.id, currentClient?.id, refreshTrigger]);

  // Handle search and filter
  useEffect(() => {
    if (!documents.length) return;
    
    let filtered = [...documents];
    
    // Apply search filter if there is a search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file_name?.toLowerCase().includes(lowercasedSearch) ||
        doc.document_type?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Apply document type filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === currentFilter);
    }
    
    setVisibleDocuments(filtered);
  }, [searchTerm, currentFilter, documents]);

  // Function to get certificate status
  const getCertificateStatus = (document: any) => {
    // Check if certificates exist and if there's at least one entry
    if (document.certificates && document.certificates.length > 0) {
      // Access the first certificate's validated field
      const validated = document.certificates[0]?.validated;
      // Return 'validated' if the field is true, otherwise 'not validated'
      return validated === true ? 'Validated' : 'Not Validated';
    }
    return 'No Certificate';
  };

  // Function to get document status display
  const getDocumentStatusDisplay = (document: any) => {
    if (!document) return { text: 'Unknown', color: 'bg-gray-500' };
    
    const status = document.status || 'pending';
    
    switch (status.toLowerCase()) {
      case 'processed':
        return { text: 'Processed', color: 'bg-green-500' };
      case 'extracted':
        return { text: 'Data Extracted', color: 'bg-blue-500' };
      case 'failed':
        return { text: 'Processing Failed', color: 'bg-red-500' };
      case 'pending':
        return { text: 'Pending', color: 'bg-yellow-500' };
      default:
        return { text: status, color: 'bg-gray-500' };
    }
  };

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    toast.success("Document uploaded successfully and linked to patient");
    // Refresh the document list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefreshDocuments = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.info("Refreshing documents...");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Patient not found</h2>
        <p className="mt-2">The patient record you are looking for does not exist or you don't have permission to view it.</p>
        <Button asChild className="mt-4">
          <Link to="/patients">Back to Patients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{patient.first_name} {patient.last_name}</h1>
          <p className="text-gray-500">ID: {patient.id_number || 'Not provided'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshDocuments}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document for {patient.first_name} {patient.last_name}</DialogTitle>
              </DialogHeader>
              <DocumentUploader 
                onUploadComplete={handleUploadComplete} 
                organizationId={currentOrganization?.id} 
                clientOrganizationId={currentClient?.id}
                patientId={patientId}
              />
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline">
            <Link to="/patients">Back to Patients</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd>{patient.first_name} {patient.last_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">ID Number</dt>
                <dd>{patient.id_number || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd>{patient.date_of_birth || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd>{patient.gender || 'Not provided'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd>{patient.contact_info?.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd>{patient.contact_info?.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd>{patient.contact_info?.address || 'Not provided'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd>{patient.contact_info?.company || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                <dd>{patient.contact_info?.occupation || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Employee ID</dt>
                <dd>{patient.employee_id || 'Not provided'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Document Fixer */}
      {currentOrganization && 
        <div className="mb-6">
          <OrphanedDocumentFixer />
        </div>
      }

      <Separator className="my-6" />
      
      {/* Patient Visits Component */}
      <div className="mb-8">
        <PatientVisits
          patientId={patientId || ''}
          organizationId={currentOrganization?.id || currentClient?.id || ''}
        />
      </div>

      <Separator className="my-6" />

      {/* Documents section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Patient Documents</h2>
          <Button variant="outline" size="sm" onClick={handleRefreshDocuments}>
            <RefreshCcw className="h-3 w-3 mr-1" />
            Refresh Documents
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full px-4 py-2 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={currentFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setCurrentFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={currentFilter === 'certificate-fitness' ? 'default' : 'outline'}
              onClick={() => setCurrentFilter('certificate-fitness')}
              size="sm"
            >
              Medical Certificates
            </Button>
            <Button 
              variant={currentFilter === 'other' ? 'default' : 'outline'}
              onClick={() => setCurrentFilter('other')}
              size="sm"
            >
              Other
            </Button>
          </div>
        </div>
        
        {visibleDocuments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 mb-4">No documents found for this patient</p>
            <Button onClick={() => setShowUploadDialog(true)}>
              Upload a Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="relative h-40 bg-gray-100">
                  {doc.public_url ? (
                    <img 
                      src={doc.public_url} 
                      alt={doc.file_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2">
                    <span className={`inline-block px-2 py-1 text-xs text-white rounded ${getDocumentStatusDisplay(doc).color}`}>
                      {getDocumentStatusDisplay(doc).text}
                    </span>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-medium truncate" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                  </p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {doc.document_type || 'Unknown type'}
                    </span>
                    <span className="text-xs">
                      {getCertificateStatus(doc)}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/patients/${patientId}/documents/${doc.id}`}>
                        View Document
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecordsPage;
