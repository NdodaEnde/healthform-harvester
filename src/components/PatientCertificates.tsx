
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import CertificateGenerator from './CertificateGenerator';
import { useOrganization } from '@/contexts/OrganizationContext';

interface PatientCertificatesProps {
  patientId: string;
}

const PatientCertificates = ({ patientId }: PatientCertificatesProps) => {
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Query certificates
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['patient-certificates', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .filter('patient_info->id', 'eq', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });
  
  const handleViewCertificate = (id: string) => {
    navigate(`/certificates/${id}`);
  };
  
  return (
    <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="list">Certificates</TabsTrigger>
          <TabsTrigger value="new">Create Certificate</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="list">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Medical Certificates</span>
              <Button size="sm" onClick={() => setActiveTab('new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Certificate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : certificates.length > 0 ? (
              <div className="space-y-4">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="flex flex-col md:flex-row justify-between gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <h3 className="font-medium">Certificate of Fitness</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">
                          {format(new Date(certificate.created_at), 'PP')}
                        </Badge>
                        {certificate.expiration_date && (
                          <Badge 
                            variant={
                              new Date(certificate.expiration_date) < new Date() 
                                ? 'destructive' 
                                : 'secondary'
                            }
                          >
                            {new Date(certificate.expiration_date) < new Date() 
                              ? 'Expired' 
                              : `Expires: ${format(new Date(certificate.expiration_date), 'PP')}`}
                          </Badge>
                        )}
                        {certificate.validated && (
                          <Badge variant="success">Validated</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewCertificate(certificate.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Certificate
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-background">
                <h3 className="text-lg font-medium mb-2">No certificates found</h3>
                <p className="text-muted-foreground mb-4">
                  This patient doesn't have any certificates yet.
                </p>
                <Button onClick={() => setActiveTab('new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Certificate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="new">
        <CertificateGenerator patientId={patientId} />
      </TabsContent>
    </Tabs>
  );
};

export default PatientCertificates;
