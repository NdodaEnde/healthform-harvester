
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

class ChatGPTQueryProcessor {
  private supabase;
  private openAIApiKey: string;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  }

  private getSchemaContext(): string {
    return `
Database Schema for Medical/Occupational Health System:

TABLES:
1. patients - Worker/patient records
   - id (uuid), first_name, last_name, id_number, date_of_birth, gender
   - organization_id, client_organization_id (for service provider model)
   - medical_history (jsonb), contact_info (jsonb)

2. medical_examinations - Medical examination records
   - id (uuid), patient_id, examination_type, examination_date, expiry_date
   - fitness_status (fit, unfit, fit_with_restriction, fit_with_condition, temporary_unfit)
   - organization_id, client_organization_id, company_name, job_title
   - restrictions (array), follow_up_actions, comments

3. medical_test_results - Individual test results within examinations
   - id (uuid), examination_id, test_type, test_result, test_done, notes
   - Common test_types: vision, hearing, drug_screen, lung_function, heights

4. certificate_compliance - Compliance tracking
   - id (uuid), patient_id, current_fitness_status, current_expiry_date
   - days_until_expiry, is_compliant, organization_id, client_organization_id

5. documents - Document management
   - id (uuid), file_name, document_type, status, validation_status
   - organization_id, client_organization_id, owner_id (patient)

6. organizations - Organization/company records
   - id (uuid), name, organization_type (service_provider or client)
   - industry, contact_email, contact_phone

7. organization_relationships - Service provider to client relationships
   - service_provider_id, client_id, is_active

IMPORTANT SECURITY RULES:
- ALWAYS filter by organization context using: organization_id = '{organization_id}' OR client_organization_id IN ({client_organization_ids})
- For service providers: include ALL their client organization IDs
- For client organizations: include only their own ID
- NEVER expose data from other organizations

COMMON QUERY PATTERNS:
- Certificate expiry: JOIN patients p with certificate_compliance cc
- Test results: JOIN medical_examinations me with medical_test_results mtr
- Organization filtering: Use provided organization_id and client_organization_ids
- Date ranges: Use examination_date, expiry_date, created_at fields
`;
  }

  async processQuery(queryRequest: QueryRequest): Promise<any> {
    const { query, userContext, maxResults = 100 } = queryRequest;

    try {
      console.log('Processing ChatGPT-powered query:', query);
      console.log('User context:', JSON.stringify(userContext, null, 2));
      
      if (!this.openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      if (!userContext.organizationId) {
        throw new Error('Organization ID is required');
      }

      if (!query || query.trim() === '') {
        throw new Error('Query cannot be empty');
      }

      // Generate SQL using ChatGPT
      const sqlQuery = await this.generateSQLWithChatGPT(query, userContext);
      console.log('Generated SQL:', sqlQuery);

      // Execute the generated SQL
      const { data, error } = await this.supabase.rpc('execute_secure_query', {
        query_sql: sqlQuery,
        max_results: maxResults
      });

      if (error) {
        console.error('Database RPC error:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      console.log('Query executed successfully, rows:', data?.row_count || 0);

      return {
        success: true,
        data: data?.data || [],
        rowCount: data?.row_count || 0,
        queryExplanation: `AI-generated query for: "${query}"`,
        executedSQL: sqlQuery,
        suggestedQueries: this.getSuggestedQueries()
      };

    } catch (error) {
      console.error('Query processing error:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred during query processing',
        suggestedQueries: this.getSuggestedQueries(),
        hint: "Try rephrasing your query or use one of the suggested examples"
      };
    }
  }

  private async generateSQLWithChatGPT(userQuery: string, userContext: UserContext): Promise<string> {
    const clientIds = (userContext.clientOrganizationIds || [])
      .filter(id => id && id.trim() !== '')
      .map(id => `'${id}'`)
      .join(',');

    const systemPrompt = `You are a SQL expert for a medical/occupational health database. Generate ONLY the SQL query, no explanations.

${this.getSchemaContext()}

SECURITY REQUIREMENTS (CRITICAL):
- Organization ID: ${userContext.organizationId}
- Client Organization IDs: [${clientIds}]
- ALWAYS include this WHERE clause for security: (organization_id = '${userContext.organizationId}' OR client_organization_id IN (${clientIds || `'${userContext.organizationId}'`}))

RULES:
1. Generate ONLY SELECT statements
2. Always include the security WHERE clause
3. Use proper JOINs for related data
4. Limit results to reasonable numbers
5. Handle dates properly
6. Use COALESCE for nullable fields
7. Order results logically

Return ONLY the SQL query, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedSQL = data.choices[0].message.content.trim();
    
    // Clean up the SQL (remove markdown formatting if present)
    return generatedSQL.replace(/```sql\n?|\n?```/g, '').trim();
  }

  private getSuggestedQueries(): string[] {
    return [
      "Show me patients with expired certificates",
      "Find all unfit medical examinations from last month",
      "List workers with vision test failures",
      "Show documents pending validation",
      "Find workers with hearing test failures",
      "Show analytics overview for this year",
      "List patients with expiring certificates next month",
      "Find workers with drug test failures",
      "Show compliance rate by company",
      "List workers needing follow-up actions"
    ];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const queryRequest: QueryRequest = await req.json();
    
    console.log('ChatGPT natural language query request received');
    console.log('Organization ID:', queryRequest.userContext?.organizationId);
    console.log('Query:', queryRequest.query);
    
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

    const processor = new ChatGPTQueryProcessor();
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
