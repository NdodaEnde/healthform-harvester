
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface ExaminationTypeData {
  preEmployment: number;
  periodical: number;
  exit: number;
}

interface FitnessStatusData {
  fit: number;
  fitWithRestriction: number;
  fitWithCondition: number;
  temporaryUnfit: number;
  unfit: number;
  total: number;
}

interface ExaminationAnalytics {
  examinationTypes: ExaminationTypeData;
  fitnessStatus: FitnessStatusData;
  totalExaminations: number;
  thisMonthExaminations: number;
  expiringCertificates: number;
  totalPatients: number;
}

export function useExaminationAnalytics() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  return useQuery({
    queryKey: ['examination-analytics', organizationId],
    queryFn: async (): Promise<ExaminationAnalytics> => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      // Fetch medical examinations
      const { data: examinations, error: examinationsError } = await supabase
        .from('medical_examinations')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

      if (examinationsError) throw examinationsError;

      // Fetch patients count
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

      if (patientsError) throw patientsError;

      const examinationData = examinations || [];
      const totalPatients = patients?.length || 0;

      // Calculate examination types
      const examinationTypes: ExaminationTypeData = {
        preEmployment: examinationData.filter(exam => 
          exam.examination_type?.toLowerCase().includes('pre-employment') ||
          exam.examination_type?.toLowerCase().includes('preemployment') ||
          exam.examination_type?.toLowerCase().includes('pre employment')
        ).length,
        periodical: examinationData.filter(exam => 
          exam.examination_type?.toLowerCase().includes('periodical') ||
          exam.examination_type?.toLowerCase().includes('periodic') ||
          exam.examination_type?.toLowerCase().includes('annual')
        ).length,
        exit: examinationData.filter(exam => 
          exam.examination_type?.toLowerCase().includes('exit') ||
          exam.examination_type?.toLowerCase().includes('termination')
        ).length
      };

      // Calculate fitness status
      const fitnessStatus: FitnessStatusData = {
        fit: examinationData.filter(exam => 
          exam.fitness_status?.toLowerCase() === 'fit' && 
          !exam.fitness_status?.toLowerCase().includes('restriction') &&
          !exam.fitness_status?.toLowerCase().includes('condition')
        ).length,
        fitWithRestriction: examinationData.filter(exam => 
          exam.fitness_status?.toLowerCase().includes('restriction')
        ).length,
        fitWithCondition: examinationData.filter(exam => 
          exam.fitness_status?.toLowerCase().includes('condition')
        ).length,
        temporaryUnfit: examinationData.filter(exam => 
          exam.fitness_status?.toLowerCase().includes('temporary') && 
          exam.fitness_status?.toLowerCase().includes('unfit')
        ).length,
        unfit: examinationData.filter(exam => 
          exam.fitness_status?.toLowerCase() === 'unfit' &&
          !exam.fitness_status?.toLowerCase().includes('temporary')
        ).length,
        total: examinationData.length
      };

      // Calculate this month examinations
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const thisMonthExaminations = examinationData.filter(exam => 
        exam.examination_date && new Date(exam.examination_date) >= firstDayOfMonth
      ).length;

      // Calculate expiring certificates (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringCertificates = examinationData.filter(exam => 
        exam.expiry_date && 
        new Date(exam.expiry_date) <= thirtyDaysFromNow &&
        new Date(exam.expiry_date) >= new Date()
      ).length;

      return {
        examinationTypes,
        fitnessStatus,
        totalExaminations: examinationData.length,
        thisMonthExaminations,
        expiringCertificates,
        totalPatients
      };
    },
    enabled: !!organizationId,
  });
}
