// src/hooks/useDashboardMetrics.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DashboardMetrics {
  totalActiveEmployees: number;
  complianceRate: number;
  certificatesExpiring: number;
  testsThisMonth: number;
  pendingReviews: number;
  systemHealth: number;
  missingRecords: number;
  clientName: string;
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export function useDashboardMetrics() {
  const { getEffectiveOrganizationId, currentOrganization } = useOrganization();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalActiveEmployees: 0,
    complianceRate: 0,
    certificatesExpiring: 0,
    testsThisMonth: 0,
    pendingReviews: 0,
    systemHealth: 0,
    missingRecords: 0,
    clientName: 'Loading...',
    loading: true,
    error: null,
    lastUpdated: new Date()
  });

  const fetchMetrics = useCallback(async () => {
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: 'No organization selected'
      }));
      return;
    }

    setMetrics(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Fetching corrected metrics for organization:', organizationId);

      // Determine organization filter
      const isServiceProvider = organizationId === 'e95df707-d618-4ca4-9e2f-d80359e96622';
      const orgFilter = isServiceProvider 
        ? `organization_id.eq.${organizationId}`
        : `client_organization_id.eq.${organizationId}`;

      // 1. TOTAL PATIENTS - ✅ This was working correctly
      const { count: patientCount, error: patientError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .or(orgFilter);

      if (patientError) throw patientError;

      // 2. COMPLIANCE RATE - 🔧 FIXED CALCULATION
      // Problem: Was calculating wrong - need to use certificate_compliance table properly
      const { data: complianceData, error: complianceError } = await supabase
        .from('certificate_compliance')
        .select('is_compliant, current_expiry_date')
        .or(orgFilter);

      if (complianceError) throw complianceError;

      // Calculate REAL compliance rate (matches our SQL findings)
      const totalComplianceRecords = complianceData?.length || 0;
      const compliantRecords = complianceData?.filter(record => {
        // A record is compliant if:
        // 1. is_compliant is true, OR
        // 2. No expiry date (assumed compliant), OR  
        // 3. Expiry date is in the future
        if (record.is_compliant === true) return true;
        if (!record.current_expiry_date) return true;
        return new Date(record.current_expiry_date) >= new Date();
      }).length || 0;

      const realComplianceRate = totalComplianceRecords > 0 
        ? (compliantRecords / totalComplianceRecords) * 100 
        : 100;

      console.log('📊 Compliance calculation:', {
        totalRecords: totalComplianceRecords,
        compliantRecords,
        rate: realComplianceRate
      });

      // 3. CERTIFICATES EXPIRING - ✅ This was working correctly
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const today = new Date();

      const expiringCount = complianceData?.filter(record => {
        if (!record.current_expiry_date) return false;
        const expiryDate = new Date(record.current_expiry_date);
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      // 4. TESTS THIS MONTH - 🔧 FIXED CALCULATION  
      // Problem: Was using wrong date filtering
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfMonthStr = firstDayOfMonth.toISOString().split('T')[0];

      console.log('📅 Searching for tests since:', firstDayOfMonthStr);

      const { count: testsThisMonth, error: testsError } = await supabase
        .from('medical_examinations')
        .select('*', { count: 'exact', head: true })
        .or(orgFilter)
        .gte('examination_date', firstDayOfMonthStr);

      if (testsError) throw testsError;

      console.log('🧪 Tests this month found:', testsThisMonth);

      // 5. PENDING REVIEWS - 🔧 IMPROVED CALCULATION
      // Get patient IDs for this organization first
      const { data: orgPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id')
        .or(orgFilter);

      if (patientsError) throw patientsError;

      const patientIds = orgPatients?.map(p => p.id) || [];

      // Then get documents for those patients
      const { count: pendingDocuments, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('owner_id', patientIds)
        .eq('status', 'uploaded'); // Only uploaded (not processed) documents

      if (docError) throw docError;

      // 6. SYSTEM HEALTH - 🔧 FIXED CALCULATION
      // Problem: Was calculating wrong - need proper processed vs total ratio
      const { data: allDocuments, error: allDocsError } = await supabase
        .from('documents')
        .select('status')
        .in('owner_id', patientIds);

      if (allDocsError) throw allDocsError;

      const totalDocuments = allDocuments?.length || 1; // Avoid division by zero
      const processedDocuments = allDocuments?.filter(doc => doc.status === 'processed').length || 0;
      const realSystemHealth = (processedDocuments / totalDocuments) * 100;

      console.log('🏥 System health calculation:', {
        totalDocs: totalDocuments,
        processedDocs: processedDocuments,
        health: realSystemHealth
      });

      // 7. MISSING RECORDS - ✅ This was working correctly
      const missingRecords = Math.max(0, (patientCount || 0) - totalComplianceRecords);

      // Update with CORRECTED metrics
      setMetrics({
        totalActiveEmployees: patientCount || 0,
        complianceRate: Math.round(realComplianceRate * 100) / 100, // 🔧 FIXED
        certificatesExpiring: expiringCount,
        testsThisMonth: testsThisMonth || 0, // 🔧 FIXED  
        pendingReviews: pendingDocuments || 0,
        systemHealth: Math.round(realSystemHealth * 100) / 100, // 🔧 FIXED
        missingRecords,
        clientName: currentOrganization?.name || 'Unknown Organization',
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

      console.log('✅ Updated metrics with corrected calculations');

    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      }));
    }
  }, [getEffectiveOrganizationId, currentOrganization]);

  // Fetch metrics when organization changes
  useEffect(() => {
    console.log('🔄 Organization changed, fetching corrected metrics...');
    fetchMetrics();
  }, [fetchMetrics]);

  // Refresh function
  const refreshMetrics = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}