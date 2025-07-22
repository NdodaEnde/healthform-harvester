/**
 * Production Error Monitoring System
 * Tracks and logs errors for production debugging
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: string;
  stack?: string;
  userId?: string;
  route: string;
  userAgent: string;
  component?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorMonitoring {
  private errors: ErrorLog[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  logError(error: Error | string, context: {
    component?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
  } = {}) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: context.userId,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      component: context.component,
      severity: context.severity || 'medium'
    };

    this.errors.unshift(errorLog);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorMonitoring]', errorLog);
    }

    // For critical errors, also log to browser console in production
    if (errorLog.severity === 'critical') {
      console.error('[CRITICAL ERROR]', errorLog);
    }
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  getErrorsByComponent(component: string): ErrorLog[] {
    return this.errors.filter(error => error.component === component);
  }

  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): ErrorLog[] {
    return this.errors.filter(error => error.severity === severity);
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Get error summary for health check
  getHealthSummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(error => error.timestamp > oneHourAgo);
    const criticalErrors = recentErrors.filter(error => error.severity === 'critical');
    
    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      criticalErrors: criticalErrors.length,
      status: criticalErrors.length > 0 ? 'critical' : 
               recentErrors.length > 10 ? 'warning' : 'healthy'
    };
  }
}

// Global error monitoring instance
export const errorMonitoring = new ErrorMonitoring();

// Global error handler
window.addEventListener('error', (event) => {
  errorMonitoring.logError(event.error || event.message, {
    severity: 'high',
    component: 'global'
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorMonitoring.logError(event.reason, {
    severity: 'critical',
    component: 'promise'
  });
});
