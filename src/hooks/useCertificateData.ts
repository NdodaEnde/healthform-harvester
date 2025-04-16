
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Certificate {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  status: string;
  created_at: string;
  extracted_data: any;
  [key: string]: any;
}

export function useCertificateData(certificateId: string) {
  const {
    data: certificate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: async (): Promise<Certificate | null> => {
      if (!certificateId) return null;
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', certificateId)
        .single();
      
      if (error) throw new Error(error.message);
      return data as Certificate;
    },
    enabled: Boolean(certificateId),
  });

  // Determine if the certificateId is valid (has correct format)
  const isValidCertificateId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certificateId);
  
  return {
    certificate,
    isLoading,
    error: error instanceof Error ? error.message : null,
    isValidCertificateId: certificateId ? isValidCertificateId : null,
  };
}
