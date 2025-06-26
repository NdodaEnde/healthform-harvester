
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserContext {
  userId: string;
  organizationId: string;
  clientOrganizationIds: string[];
  role: string;
}

interface QueryRequest {
  query: string;
  userContext: UserContext;
  maxResults?: number;
}

interface MedicalQueryTemplate {
  pattern: RegExp;
  sqlTemplate: string;
  description: string;
  securityFields: string[];
}

class MedicalQueryProcessor {
  private supabase;
  private medicalTemplates: MedicalQueryTemplate[];

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Define medical query patterns
    this.medicalTemplates = [
      {
        pattern: /(?:show|find|list|get).*patients.*(?:expired|expiring).*certificates?/i,
        sqlTemplate: `
          SELECT p.first_name, p.last_name, p.id_number, cc.current_expiry_date, 
                 cc.days_until_expiry, o.name as organization_name
          FROM patients p
          JOIN certificate_compliance cc ON p.id = cc.patient_id
          LEFT JOIN organizations o ON p.client_organization_id = o.id
          WHERE cc.days_until_expiry <= {expiry_days}
          AND (p.organization_id = '{organization_id}' OR p.client_organization_id = ANY(ARRAY[{client_organization_ids}]))
        `,
        description: "Finding patients with expired or expiring certificates",
        securityFields: ['organization_id', 'client_organization_id']
      },
      {
        pattern: /(?:show|find|list).*(?:medical|examination|exam).*(?:unfit|failed|fail)/i,
        sqlTemplate: `
          SELECT p.first_name, p.last_name, me.examination_date, me.fitness_status, 
                 me.examination_type, o.name as organization_name
          FROM patients p
          JOIN medical_examinations me ON p.id = me.patient_id
          LEFT JOIN organizations o ON p.client_organization_id = o.id
          WHERE me.fitness_status IN ('unfit', 'fit_with_restriction')
          AND (me.organization_id = '{organization_id}' OR me.client_organization_id = ANY(ARRAY[{client_organization_ids}]))
          ORDER BY me.examination_date DESC
        `,
        description: "Finding unfit or restricted medical examinations",
        securityFields: ['organization_id', 'client_organization_id']
      },
      {
        pattern: /(?:show|find|list).*(?:vision|hearing|drug|medical).*(?:test|screen).*(?:fail|failed|failure)/i,
        sqlTemplate: `
          SELECT p.first_name, p.last_name, mtr.test_type, mtr.test_result, 
                 me.examination_date, o.name as organization_name
          FROM patients p
          JOIN medical_examinations me ON p.id = me.patient_id
          JOIN medical_test_results mtr ON me.id = mtr.examination_id
          LEFT JOIN organizations o ON p.client_organization_id = o.id
          WHERE mtr.test_result ILIKE '%fail%'
          AND (me.organization_id = '{organization_id}' OR me.client_organization_id = ANY(ARRAY[{client_organization_ids}]))
          ORDER BY me.examination_date DESC
        `,
        description: "Finding failed medical tests",
        securityFields: ['organization_id', 'client_organization_id']
      },
      {
        pattern: /(?:show|find|list).*documents.*(?:pending|validation|unvalidated)/i,
        sqlTemplate: `
          SELECT d.file_name, d.created_at, p.first_name, p.last_name, 
                 d.validation_status, o.name as organization_name
          FROM documents d
          LEFT JOIN patients p ON d.owner_id = p.id
          LEFT JOIN organizations o ON d.organization_id = o.id
          WHERE d.validation_status = 'pending'
          AND (d.organization_id = '{organization_id}' OR d.client_organization_id = ANY(ARRAY[{client_organization_ids}]))
          ORDER BY d.created_at DESC
        `,
        description: "Finding documents pending validation",
        securityFields: ['organization_id', 'client_organization_id']
      },
      {
        pattern: /(?:show|find|list).*(?:analytics|summary|overview)/i,
        sqlTemplate: `
          SELECT * FROM get_examination_analytics('{organization_id}'::uuid)
        `,
        description: "Getting examination analytics overview",
        securityFields: ['organization_id']
      }
    ];
  }

  async processQuery(queryRequest: QueryRequest): Promise<any> {
    const { query, userContext, maxResults = 100 } = queryRequest;

    try {
      console.log('Processing natural language query:', query);
      
      // Find matching template
      const template = this.findMatchingTemplate(query);
      if (!template) {
        return {
          success: false,
          error: "Query pattern not recognized",
          suggestedQueries: this.getSuggestedQueries(),
          hint: "Try queries like 'show patients with expired certificates' or 'find failed vision tests'"
        };
      }

      console.log('Matched template:', template.description);

      // Apply security context and parameters
      const secureSQL = this.buildSecureQuery(template, userContext, query);
      
      console.log('Executing SQL:', secureSQL.substring(0, 200) + '...');

      // Execute query using the secure function
      const { data, error } = await this.supabase.rpc('execute_secure_query', {
        query_sql: secureSQL,
        max_results: maxResults
      });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Query executed successfully, rows:', data?.row_count || 0);

      return {
        success: true,
        data: data?.data || [],
        rowCount: data?.row_count || 0,
        queryExplanation: template.description,
        executedSQL: data?.query_executed || secureSQL,
        suggestedQueries: this.getSuggestedQueries()
      };

    } catch (error) {
      console.error('Query processing error:', error);
      return {
        success: false,
        error: error.message,
        suggestedQueries: this.getSuggestedQueries()
      };
    }
  }

  private findMatchingTemplate(query: string): MedicalQueryTemplate | null {
    return this.medicalTemplates.find(template => 
      template.pattern.test(query)
    ) || null;
  }

  private buildSecureQuery(template: MedicalQueryTemplate, userContext: UserContext, originalQuery: string): string {
    let sql = template.sqlTemplate;
    
    // Apply security context
    sql = sql.replace(/{organization_id}/g, userContext.organizationId);
    
    // Handle client organization IDs array
    const clientIds = userContext.clientOrganizationIds
      .map(id => `'${id}'`)
      .join(',');
    sql = sql.replace(/{client_organization_ids}/g, clientIds);
    
    // Extract and apply parameters from the query
    const parameters = this.extractParameters(originalQuery);
    
    // Apply expiry days parameter
    if (parameters.expiry_days !== undefined) {
      sql = sql.replace(/{expiry_days}/g, parameters.expiry_days.toString());
    }
    
    // Add date filters if specified
    if (parameters.days_back !== undefined) {
      const dateCondition = `AND me.examination_date >= CURRENT_DATE - INTERVAL '${parameters.days_back} days'`;
      sql = sql.replace('ORDER BY', dateCondition + ' ORDER BY');
    }
    
    return sql;
  }

  private extractParameters(query: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract expiry parameters
    if (query.includes('expired')) {
      parameters.expiry_days = 0;
    } else if (query.includes('expiring')) {
      if (query.includes('next month')) {
        parameters.expiry_days = 30;
      } else if (query.includes('next week')) {
        parameters.expiry_days = 7;
      } else {
        parameters.expiry_days = 30; // Default to 30 days
      }
    }

    // Extract date ranges
    const dateMatches = query.match(/(?:last|past)\s+(\d+)\s+(day|week|month|year)s?/i);
    if (dateMatches) {
      const [, amount, unit] = dateMatches;
      const multiplier = { day: 1, week: 7, month: 30, year: 365 }[unit] || 1;
      parameters.days_back = parseInt(amount) * multiplier;
    } else if (query.includes('last month')) {
      parameters.days_back = 30;
    } else if (query.includes('last week')) {
      parameters.days_back = 7;
    }

    return parameters;
  }

  private getSuggestedQueries(): string[] {
    return [
      "Show me patients with expired certificates",
      "Find all unfit medical examinations from last month", 
      "List vision test failures from this year",
      "Show documents pending validation",
      "Find workers with hearing test failures",
      "Show analytics overview",
      "List patients with expiring certificates next month"
    ];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const queryRequest: QueryRequest = await req.json();
    
    // Validate user context
    if (!queryRequest.userContext?.organizationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid user context - organization ID required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    if (!queryRequest.query?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query cannot be empty'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('Natural language query request from org:', queryRequest.userContext.organizationId);

    const processor = new MedicalQueryProcessor();
    const result = await processor.processQuery(queryRequest);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
