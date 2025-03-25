
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';

export interface PatientCertificatesProps {
  patientId: string;
  organizationId?: string;
}

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ patientId, organizationId }) => {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['patient-certificates', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('patient_info->id', patientId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No certificates found for this patient.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {certificates.map((certificate) => {
        const expiresAt = certificate.expiration_date 
          ? format(new Date(certificate.expiration_date), 'MMM d, yyyy')
          : 'No expiration';
          
        const isExpired = certificate.expiration_date 
          ? new Date(certificate.expiration_date) < new Date() 
          : false;
          
        return (
          <Card key={certificate.id} className={isExpired ? 'border-red-300' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                <span>
                  <FileText className="inline-block mr-2 h-4 w-4" /> 
                  {certificate.fitness_declaration?.statement?.substring(0, 50)}...
                </span>
                {isExpired && (
                  <span className="text-xs font-normal px-2 py-1 bg-red-100 text-red-600 rounded">
                    Expired
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 text-sm text-muted-foreground">
              <p>Issued: {format(new Date(certificate.created_at), 'MMM d, yyyy')}</p>
              <p>Expires: {expiresAt}</p>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/certificates/${certificate.id}`}>
                  View
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-3 w-3" /> Download
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default PatientCertificates;
