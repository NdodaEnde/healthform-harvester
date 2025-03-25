
import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCertificateTemplate } from '@/services/certificateTemplateService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

// Define proper types for our certificate data
interface Certificate {
  id: string;
  created_at: string;
  expiration_date?: string;
  template_id?: string;
  company_info: {
    name?: string;
    logo_url?: string;
  };
  patient_info: {
    first_name?: string;
    last_name?: string;
    birthdate?: string;
  };
  fitness_declaration?: {
    statement?: string;
  };
  restrictions?: string[];
}

const CertificateViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Query certificate data
  const { data: certificate, isLoading: isLoadingCertificate } = useQuery({
    queryKey: ['certificate', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Certificate;
    },
    enabled: !!id,
  });
  
  // Query template data if available
  const { data: template } = useQuery({
    queryKey: ['certificate-template', certificate?.template_id],
    queryFn: () => fetchCertificateTemplate(certificate?.template_id || ''),
    enabled: !!certificate?.template_id,
  });
  
  // Handle printing
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Certificate-${certificate?.id?.substring(0, 8)}`,
  });

  // Email certificate handling
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [emailSubject, setEmailSubject] = React.useState('Your Medical Certificate');
  const [emailMessage, setEmailMessage] = React.useState('Please find your medical certificate attached.');
  const [isSending, setIsSending] = React.useState(false);

  const sendCertificate = async () => {
    if (!certificate || !id || !currentOrganization?.id) return;
    
    setIsSending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-certificate', {
        body: {
          certificateId: id,
          recipientEmail,
          organizationId: currentOrganization.id,
          subject: emailSubject,
          message: emailMessage
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Certificate sent",
        description: "The certificate has been sent successfully."
      });
      
    } catch (error) {
      console.error("Error sending certificate:", error);
      toast({
        title: "Error",
        description: "Failed to send certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoadingCertificate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!certificate) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Certificate Not Found</h2>
        <p className="text-muted-foreground mb-4">The certificate you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }
  
  // Get template styling
  const getTemplateStyles = () => {
    if (!template) return {};
    
    const { template_data } = template;
    
    return {
      fontFamily: template_data.font === 'default' ? 
        'system-ui, sans-serif' : 
        template_data.font,
      '--primary-color': template_data.primary_color,
      '--secondary-color': template_data.secondary_color,
      // Add other styling based on template
    } as React.CSSProperties;
  };
  
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Certificate via Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-medium">
                    Recipient Email
                  </label>
                  <input
                    id="recipient"
                    type="email"
                    className="w-full border rounded-md p-2"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    className="w-full border rounded-md p-2 min-h-[100px]"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={sendCertificate}
                  disabled={!recipientEmail || isSending}
                >
                  {isSending ? 'Sending...' : 'Send Certificate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div 
        className="border rounded-lg p-8 shadow-lg bg-white" 
        ref={printRef}
        style={getTemplateStyles()}
      >
        <div className="certificate-content">
          {/* Header with organization logo */}
          <div className={`flex justify-${template?.template_data.logo_position || 'center'} mb-6`}>
            {certificate.company_info?.logo_url ? (
              <img 
                src={certificate.company_info.logo_url} 
                alt={certificate.company_info.name || "Organization logo"} 
                className="h-16 object-contain"
              />
            ) : (
              <h1 className="text-3xl font-bold text-center" style={{ color: 'var(--primary-color, #0f172a)' }}>
                {certificate.company_info?.name || currentOrganization?.name || "Medical Certificate"}
              </h1>
            )}
          </div>
          
          {/* Certificate title */}
          <h1 className="text-3xl font-bold text-center mb-6" style={{ color: 'var(--primary-color, #0f172a)' }}>
            {template?.template_data.header || "Medical Certificate"}
          </h1>
          
          {/* Patient information */}
          <div className="mb-8 text-center">
            <p className="text-lg mb-1">This certifies that</p>
            <h2 className="text-2xl font-bold mb-1">
              {certificate.patient_info?.first_name} {certificate.patient_info?.last_name}
            </h2>
            <p className="text-lg">
              Date of Birth: {certificate.patient_info?.birthdate && format(new Date(certificate.patient_info.birthdate), "MMMM d, yyyy")}
            </p>
          </div>
          
          {/* Certificate content */}
          <div className="mb-8 text-center">
            <p className="text-lg mb-4">
              Has been examined and is certified fit according to medical standards.
            </p>
            
            {certificate.fitness_declaration && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-color, #0f172a)' }}>
                  Fitness Declaration
                </h3>
                <p>{certificate.fitness_declaration.statement}</p>
              </div>
            )}
            
            {certificate.restrictions && certificate.restrictions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-color, #0f172a)' }}>
                  Restrictions
                </h3>
                <ul className="list-disc mx-auto text-left inline-block">
                  {certificate.restrictions.map((restriction: string, index: number) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Certificate details */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="font-medium">Issue Date:</p>
              <p>{format(new Date(certificate.created_at), "MMMM d, yyyy")}</p>
            </div>
            
            {certificate.expiration_date && (
              <div>
                <p className="font-medium">Expiration Date:</p>
                <p>{format(new Date(certificate.expiration_date), "MMMM d, yyyy")}</p>
              </div>
            )}
          </div>
          
          {/* Signature line if enabled in template */}
          {(!template || template.template_data.include_signature !== false) && (
            <div className="mt-16 border-t pt-4 w-64">
              <p className="text-sm" style={{ color: 'var(--secondary-color, #64748b)' }}>Authorized Signature</p>
            </div>
          )}
          
          {/* Organization details if enabled in template */}
          {(!template || template.template_data.include_organization_details !== false) && (
            <div className="mt-8 text-sm text-center" style={{ color: 'var(--secondary-color, #64748b)' }}>
              <p>{certificate.company_info?.name || currentOrganization?.name}</p>
              {currentOrganization?.contact_email && (
                <p>{currentOrganization.contact_email}</p>
              )}
            </div>
          )}
          
          {/* Footer from template */}
          {template?.template_data.footer && (
            <div className="mt-8 text-sm text-center" style={{ color: 'var(--secondary-color, #64748b)' }}>
              {template.template_data.footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateViewerPage;
