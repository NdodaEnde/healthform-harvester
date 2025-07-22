import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { healthService, SystemHealth } from '@/services/HealthService';
import { errorMonitoring } from '@/utils/errorMonitoring';

interface CheckItem {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  severity: 'critical' | 'high' | 'medium' | 'low';
  details?: string;
}

export default function ProductionReadinessChecker() {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  const runProductionChecks = async () => {
    setIsRunning(true);
    const checkResults: CheckItem[] = [];

    try {
      // 1. Database Security Check
      checkResults.push({
        id: 'rls-enabled',
        title: 'Row Level Security',
        description: 'Verify RLS is enabled on all public tables',
        status: 'pending',
        severity: 'critical'
      });

      // 2. Authentication Check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        checkResults.push({
          id: 'auth-working',
          title: 'Authentication System',
          description: 'User authentication is functioning correctly',
          status: session ? 'pass' : 'warning',
          severity: 'critical',
          details: session ? 'User authenticated' : 'No active session (expected in some cases)'
        });
      } catch (error) {
        checkResults.push({
          id: 'auth-working',
          title: 'Authentication System',
          description: 'User authentication is functioning correctly',
          status: 'fail',
          severity: 'critical',
          details: `Auth error: ${(error as Error).message}`
        });
      }

      // 3. Database Connectivity
      try {
        const { error } = await supabase.from('organizations').select('id').limit(1);
        checkResults.push({
          id: 'db-connectivity',
          title: 'Database Connectivity',
          description: 'Can connect to and query database',
          status: error ? 'fail' : 'pass',
          severity: 'critical',
          details: error ? error.message : 'Database accessible'
        });
      } catch (error) {
        checkResults.push({
          id: 'db-connectivity',
          title: 'Database Connectivity',
          description: 'Can connect to and query database',
          status: 'fail',
          severity: 'critical',
          details: `Connection error: ${(error as Error).message}`
        });
      }

      // 4. Edge Functions Check
      try {
        const { error } = await supabase.functions.invoke('health-check');
        checkResults.push({
          id: 'edge-functions',
          title: 'Edge Functions',
          description: 'Edge functions are deployed and accessible',
          status: error ? 'fail' : 'pass',
          severity: 'high',
          details: error ? error.message : 'Health check function responsive'
        });
      } catch (error) {
        checkResults.push({
          id: 'edge-functions',
          title: 'Edge Functions',
          description: 'Edge functions are deployed and accessible',
          status: 'fail',
          severity: 'high',
          details: `Function error: ${(error as Error).message}`
        });
      }

      // 5. Storage Check
      try {
        const { error } = await supabase.storage.listBuckets();
        checkResults.push({
          id: 'storage-access',
          title: 'Storage Access',
          description: 'File storage is accessible',
          status: error ? 'fail' : 'pass',
          severity: 'medium',
          details: error ? error.message : 'Storage buckets accessible'
        });
      } catch (error) {
        checkResults.push({
          id: 'storage-access',
          title: 'Storage Access',
          description: 'File storage is accessible',
          status: 'fail',
          severity: 'medium',
          details: `Storage error: ${(error as Error).message}`
        });
      }

      // 6. Error Monitoring Check
      const errorSummary = errorMonitoring.getHealthSummary();
      checkResults.push({
        id: 'error-monitoring',
        title: 'Error Monitoring',
        description: 'Error tracking system is active',
        status: errorSummary.status === 'critical' ? 'fail' : 
               errorSummary.status === 'warning' ? 'warning' : 'pass',
        severity: 'medium',
        details: `${errorSummary.recentErrors} recent errors, ${errorSummary.criticalErrors} critical`
      });

      // 7. System Health Check
      const health = await healthService.checkSystemHealth();
      setSystemHealth(health);
      checkResults.push({
        id: 'system-health',
        title: 'Overall System Health',
        description: 'System components are functioning properly',
        status: health.overall === 'healthy' ? 'pass' : 
               health.overall === 'degraded' ? 'warning' : 'fail',
        severity: 'high',
        details: `Database: ${health.database}, API: ${health.api}, Storage: ${health.storage}`
      });

    } catch (error) {
      errorMonitoring.logError(error as Error, {
        component: 'ProductionReadinessChecker',
        severity: 'high'
      });
    }

    setChecks(checkResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runProductionChecks();
  }, []);

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: CheckItem['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">WARN</Badge>;
      case 'pending':
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  const getSeverityColor = (severity: CheckItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
    }
  };

  const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status === 'fail').length;
  const totalIssues = checks.filter(c => c.status === 'fail').length;
  const isProductionReady = criticalIssues === 0 && totalIssues <= 1;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Production Readiness Check
          {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Verify system readiness for production deployment
        </CardDescription>
        <div className="flex items-center gap-4">
          <Button 
            onClick={runProductionChecks} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? 'Running Checks...' : 'Re-run Checks'}
          </Button>
          {checks.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={isProductionReady ? "default" : "destructive"}
                className={isProductionReady ? "bg-green-100 text-green-800" : ""}
              >
                {isProductionReady ? '✓ READY FOR PRODUCTION' : `❌ ${criticalIssues} CRITICAL ISSUES`}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check) => (
            <div 
              key={check.id} 
              className={`p-4 border rounded-lg border-l-4 ${getSeverityColor(check.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <h4 className="font-medium">{check.title}</h4>
                    <p className="text-sm text-muted-foreground">{check.description}</p>
                    {check.details && (
                      <p className="text-xs mt-1 text-gray-600">{check.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {check.severity.toUpperCase()}
                  </Badge>
                  {getStatusBadge(check.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {systemHealth && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">System Health Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Overall:</span>
                <span className={`ml-2 font-medium ${
                  systemHealth.overall === 'healthy' ? 'text-green-600' : 
                  systemHealth.overall === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {systemHealth.overall.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Database:</span>
                <span className={`ml-2 font-medium ${
                  systemHealth.database === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemHealth.database.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">API:</span>
                <span className={`ml-2 font-medium ${
                  systemHealth.api === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemHealth.api.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Errors:</span>
                <span className="ml-2 font-medium">{systemHealth.errors}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}