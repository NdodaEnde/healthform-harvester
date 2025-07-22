import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    database: 'healthy' | 'down';
    functions: 'healthy' | 'down';
    storage: 'healthy' | 'down';
  };
  version: string;
  uptime: number;
}

const startTime = Date.now();

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'healthy',
        functions: 'healthy',
        storage: 'healthy'
      },
      version: '1.0.0',
      uptime: Date.now() - startTime
    };

    // Check database connectivity
    try {
      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);
      
      if (error) {
        healthCheck.checks.database = 'down';
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      healthCheck.checks.database = 'down';
      healthCheck.status = 'down';
    }

    // Check storage connectivity
    try {
      const { error } = await supabase.storage.listBuckets();
      if (error) {
        healthCheck.checks.storage = 'down';
        if (healthCheck.status === 'healthy') {
          healthCheck.status = 'degraded';
        }
      }
    } catch (error) {
      console.error('Storage health check failed:', error);
      healthCheck.checks.storage = 'down';
      healthCheck.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 207 : 503;

    return new Response(
      JSON.stringify(healthCheck),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '1.0.0'
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});