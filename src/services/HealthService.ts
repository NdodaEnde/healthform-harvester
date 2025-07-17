import { supabase } from '@/integrations/supabase/client';
import { errorMonitoring } from '@/utils/errorMonitoring';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  errors: number;
}

class HealthService {
  private lastHealth: SystemHealth | null = null;
  private checkInterval: number = 60000; // 1 minute

  async checkSystemHealth(): Promise<SystemHealth> {
    const health: SystemHealth = {
      overall: 'healthy',
      database: 'healthy',
      api: 'healthy', 
      storage: 'healthy',
      lastChecked: new Date(),
      errors: 0
    };

    try {
      // Check database connectivity
      const { error: dbError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      if (dbError) {
        health.database = 'down';
        health.overall = 'degraded';
        errorMonitoring.logError(dbError, {
          component: 'HealthService',
          severity: 'high'
        });
      }

      // Check edge functions
      try {
        const { error: functionError } = await supabase.functions.invoke('health-check');
        if (functionError) {
          health.api = 'degraded';
          if (health.overall === 'healthy') health.overall = 'degraded';
        }
      } catch (error) {
        health.api = 'down';
        health.overall = 'degraded';
      }

      // Check storage
      try {
        const { error: storageError } = await supabase.storage.listBuckets();
        if (storageError) {
          health.storage = 'degraded';
          if (health.overall === 'healthy') health.overall = 'degraded';
        }
      } catch (error) {
        health.storage = 'down';
        health.overall = 'degraded';
      }

      // Get error monitoring summary
      const errorSummary = errorMonitoring.getHealthSummary();
      health.errors = errorSummary.recentErrors;
      
      if (errorSummary.status === 'critical') {
        health.overall = 'down';
      } else if (errorSummary.status === 'warning' && health.overall === 'healthy') {
        health.overall = 'degraded';
      }

    } catch (error) {
      health.overall = 'down';
      health.database = 'down';
      health.api = 'down';
      health.storage = 'down';
      
      errorMonitoring.logError(error as Error, {
        component: 'HealthService',
        severity: 'critical'
      });
    }

    this.lastHealth = health;
    return health;
  }

  getLastHealth(): SystemHealth | null {
    return this.lastHealth;
  }

  // Start periodic health checks in production
  startMonitoring() {
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        this.checkSystemHealth().catch(error => {
          errorMonitoring.logError(error, {
            component: 'HealthService',
            severity: 'high'
          });
        });
      }, this.checkInterval);
    }
  }
}

export const healthService = new HealthService();