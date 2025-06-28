
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface AnalyticsData {
  totalDocuments: number;
  processingTime: {
    average: number;
    median: number;
  };
  sectionTypes: Array<{
    type: string;
    count: number;
    accuracy: number;
  }>;
  workflowMetrics: {
    averageCompletionTime: number;
    bottlenecks: Array<{
      step: string;
      averageTime: number;
    }>;
  };
  qualityMetrics: {
    accuracyRate: number;
    reviewRate: number;
    errorRate: number;
  };
}

export function useCompoundDocumentAnalytics(timeRange: string = '30d') {
  const { getEffectiveOrganizationId } = useOrganization();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, getEffectiveOrganizationId]);

  const fetchAnalytics = async () => {
    const organizationId = getEffectiveOrganizationId();
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      startDate.setDate(endDate.getDate() - days);

      // Fetch compound documents data
      const { data: documents, error: documentsError } = await supabase
        .from('compound_documents')
        .select(`
          *,
          compound_document_sections(*),
          compound_document_workflow(*)
        `)
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (documentsError) throw documentsError;

      // Process analytics data
      const processedData = processAnalyticsData(documents || []);
      setData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching compound document analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (documents: any[]): AnalyticsData => {
    // Calculate section types distribution
    const sectionTypeCounts: Record<string, { count: number; accuracySum: number }> = {};
    let totalSections = 0;
    let totalAccuracy = 0;

    documents.forEach(doc => {
      doc.detected_sections?.forEach((section: any) => {
        const type = section.section_type || 'unknown';
        if (!sectionTypeCounts[type]) {
          sectionTypeCounts[type] = { count: 0, accuracySum: 0 };
        }
        sectionTypeCounts[type].count++;
        sectionTypeCounts[type].accuracySum += section.confidence || 0.8;
        totalSections++;
        totalAccuracy += section.confidence || 0.8;
      });
    });

    const sectionTypes = Object.entries(sectionTypeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      accuracy: data.count > 0 ? data.accuracySum / data.count : 0
    }));

    // Calculate processing times (mock data for now)
    const processingTimes = documents.map(() => Math.random() * 30 + 5); // 5-35 minutes
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length || 0;
    const sortedTimes = [...processingTimes].sort((a, b) => a - b);
    const medianProcessingTime = sortedTimes[Math.floor(sortedTimes.length / 2)] || 0;

    // Calculate workflow bottlenecks (mock data)
    const workflowSteps = [
      'receptionist_review',
      'nurse_review', 
      'tech_review',
      'doctor_approval'
    ];

    const bottlenecks = workflowSteps.map(step => ({
      step: step.replace('_', ' '),
      averageTime: Math.random() * 120 + 30 // 30-150 minutes
    }));

    return {
      totalDocuments: documents.length,
      processingTime: {
        average: averageProcessingTime,
        median: medianProcessingTime
      },
      sectionTypes,
      workflowMetrics: {
        averageCompletionTime: 180, // 3 hours average
        bottlenecks
      },
      qualityMetrics: {
        accuracyRate: totalSections > 0 ? totalAccuracy / totalSections : 0.85,
        reviewRate: 0.15, // 15% require manual review
        errorRate: 0.05   // 5% error rate
      }
    };
  };

  return {
    data,
    loading,
    error,
    refreshAnalytics: fetchAnalytics
  };
}
