
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { fetchCertificateTemplates, CertificateTemplate } from '@/services/certificateTemplateService';
import { supabase } from '@/integrations/supabase/client';

interface CertificateGeneratorProps {
  patientId: string;
  initialData?: any;
}

export default function CertificateGenerator({ patientId, initialData }: CertificateGeneratorProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateData, setTemplateData] = useState<CertificateTemplate | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    initialData?.expiration_date ? new Date(initialData.expiration_date) : undefined
  );
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [certificateData, setCertificateData] = useState<any>(initialData || {});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    subject: 'Your Medical Certificate',
    message: 'Please find your medical certificate attached.',
    ccMe: false
  });
  const [isSending, setIsSending] = useState(false);
  
  // Query patient data
  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
  
  // Query templates
  const { data: templates = [] } = useQuery({
    queryKey: ['certificateTemplates', organizationId],
    queryFn: () => fetchCertificateTemplates(organizationId || ''),
    enabled: !!organizationId,
  });
  
  // Set default template when templates load
  useEffect(() => {
    if (templates.length > 0) {
      const defaultTemplate = templates.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
        setTemplateData(defaultTemplate);
      } else {
        setSelectedTemplate(templates[0].id);
        setTemplateData(templates[0]);
      }
    }
  }, [templates]);
  
  // Update template data when selection changes
  useEffect(() => {
    if (selectedTemplate && templates.length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setTemplateData(template);
      }
    }
  }, [selectedTemplate, templates]);
  
  // Update email data when patient data changes
  useEffect(() => {
    if (patient?.contact_info?.email) {
      setEmailData(prev => ({ ...prev, recipientEmail: patient.contact_info.email }));
    }
  }, [patient]);
  
  const handleGenerateCertificate = async () => {
    if (!organizationId || !patientId || !selectedTemplate) {
      toast({
        title: "Error",
        description: "Missing required information to generate certificate",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create certificate data combining patient info, template, and other details
      const newCertificateData = {
        patient_info: {
          id: patientId,
          first_name: patient?.first_name,
          last_name: patient?.last_name,
          birthdate: patient?.date_of_birth,
          // Include other patient data as needed
        },
        organization_id: organizationId,
        template_id: selectedTemplate,
        expiration_date: expirationDate?.toISOString(),
        // Add other certificate fields
        ...certificateData
      };
      
      // Save certificate to database
      const { data, error } = await supabase
        .from('certificates')
        .upsert({
          id: certificateId || undefined,
          patient_info: newCertificateData.patient_info,
          company_info: {
            organization_id: organizationId,
            name: currentOrganization?.name,
            logo_url: currentOrganization?.logo_url,
          },
          document_id: certificateData.document_id || null,
          expiration_date: expirationDate?.toISOString(),
          updated_at: new Date().toISOString(),
          validated: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Store the certificate ID
      setCertificateId(data.id);
      
      // If expiration date is set, also create an expiration record
      if (expirationDate) {
        await supabase
          .from('certificate_expirations')
          .upsert({
            certificate_id: data.id,
            patient_id: patientId,
            organization_id: organizationId,
            expires_at: expirationDate.toISOString(),
          }, {
            onConflict: 'certificate_id'
          });
      }
      
      toast({
        title: "Success",
        description: certificateId ? "Certificate updated successfully" : "Certificate generated successfully",
      });
      
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate certificate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSendEmail = async () => {
    if (!certificateId || !emailData.recipientEmail) {
      toast({
        title: "Error",
        description: "Please generate a certificate first and provide a recipient email",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Send email using the Edge Function
      const { data, error } = await supabase.functions.invoke("send-certificate", {
        body: {
          certificateId,
          recipientEmail: emailData.recipientEmail,
          organizationId,
          subject: emailData.subject,
          message: emailData.message,
          ccSender: emailData.ccMe,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Certificate sent successfully",
      });
      
      setIsEmailDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending certificate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send certificate",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Certificate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="template">Certificate Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
              disabled={templates.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} {template.is_default && " (Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No templates available. Please create a template first.
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="expiration">Expiration Date (Optional)</Label>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expirationDate}
                    onSelect={setExpirationDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {expirationDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpirationDate(undefined)}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={handleGenerateCertificate} 
            disabled={!selectedTemplate || isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating..." : (certificateId ? "Update Certificate" : "Generate Certificate")}
          </Button>
          
          {certificateId && (
            <div className="flex space-x-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(`/certificates/${certificateId}`, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              
              <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Certificate</DialogTitle>
                    <DialogDescription>
                      Send the certificate to the patient or other recipients.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Recipient Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={emailData.recipientEmail}
                        onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                        placeholder="patient@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={emailData.subject}
                        onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={emailData.message}
                        onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ccMe"
                        checked={emailData.ccMe}
                        onCheckedChange={(checked) => 
                          setEmailData({ ...emailData, ccMe: checked === true })
                        }
                      />
                      <label
                        htmlFor="ccMe"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Send me a copy
                      </label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEmailDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSendEmail}
                      disabled={!emailData.recipientEmail || isSending}
                    >
                      {isSending ? "Sending..." : "Send Certificate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        {templates.length === 0 && (
          <div className="rounded-md bg-yellow-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="h-5 w-5 text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No templates available</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need to create at least one certificate template to generate certificates.
                    Visit the Certificate Templates page in Settings to create one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
