
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

interface DataProfile {
  fitness_statuses: string[];
  test_types: string[];
  test_results: string[];
  examination_types: string[];
  job_titles: string[];
  company_names: string[];
  document_types: string[];
  validation_stats: {
    total_documents: number;
    validated_documents: number;
    validation_rate: number;
  };
  last_updated: string;
}

class EnhancedChatGPTQueryProcessor {
  private supabase;
  private openAIApiKey: string;
  private dataProfileCache: Map<string, DataProfile> = new Map();

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  }

  private async getDataProfile(organizationId: string, clientOrganizationIds: string[]): Promise<DataProfile> {
    const cacheKey = `${organizationId}_${clientOrganizationIds.join(',')}`;
    const cached = this.dataProfileCache.get(cacheKey);
    
    // Return cached profile if less than 1 hour old
    if (cached && new Date(cached.last_updated).getTime() > Date.now() - 3600000) {
      return cached;
    }

    console.log('Building fresh data profile for organization:', organizationId);

    const orgFilter = `(organization_id = '${organizationId}' OR client_organization_id IN (${clientOrganizationIds.map(id => `'${id}'`).join(',')}))`;

    try {
      // Get actual fitness statuses
      const { data: fitnessData } = await this.supabase
        .from('medical_examinations')
        .select('fitness_status')
        .or(orgFilter.replace(/[()]/g, ''));

      // Get actual test types and results
      const { data: testData } = await this.supabase
        .from('medical_test_results')
        .select('test_type, test_result')
        .limit(1000);

      // Get examination types and job titles
      const { data: examData } = await this.supabase
        .from('medical_examinations')
        .select('examination_type, job_title, company_name')
        .or(orgFilter.replace(/[()]/g, ''))
        .limit(500);

      // Get document validation stats
      const { data: docStats } = await this.supabase
        .from('documents')
        .select('validation_status, document_type')
        .or(orgFilter.replace(/[()]/g, ''));

      const profile: DataProfile = {
        fitness_statuses: [...new Set(fitnessData?.map(d => d.fitness_status).filter(Boolean) || [])],
        test_types: [...new Set(testData?.map(d => d.test_type).filter(Boolean) || [])],
        test_results: [...new Set(testData?.map(d => d.test_result).filter(Boolean) || [])],
        examination_types: [...new Set(examData?.map(d => d.examination_type).filter(Boolean) || [])],
        job_titles: [...new Set(examData?.map(d => d.job_title).filter(Boolean) || [])],
        company_names: [...new Set(examData?.map(d => d.company_name).filter(Boolean) || [])],
        document_types: [...new Set(docStats?.map(d => d.document_type).filter(Boolean) || [])],
        validation_stats: {
          total_documents: docStats?.length || 0,
          validated_documents: docStats?.filter(d => d.validation_status === 'validated').length || 0,
          validation_rate: docStats?.length ? Math.round((docStats.filter(d => d.validation_status === 'validated').length / docStats.length) * 100) : 0
        },
        last_updated: new Date().toISOString()
      };

      this.dataProfileCache.set(cacheKey, profile);
      console.log('Data profile built:', profile);
      return profile;

    } catch (error) {
      console.error('Error building data profile:', error);
      // Return minimal profile on error
      return {
        fitness_statuses: ['fit'],
        test_types: ['vision', 'hearing'],
        test_results: ['normal', 'abnormal'],
        examination_types: ['pre-employment'],
        job_titles: [],
        company_names: [],
        document_types: ['certificate-fitness'],
        validation_stats: { total_documents: 0, validated_documents: 0, validation_rate: 0 },
        last_updated: new Date().toISOString()
      };
    }
  }

  private getEnhancedSchemaContext(profile: DataProfile): string {
    return `
Database Schema for Medical/Occupational Health System:

ACTUAL DATA PATTERNS (Based on your organization's data):
- Available fitness_status values: ${profile.fitness_statuses.join(', ')}
- Available test_types: ${profile.test_types.join(', ')}
- Common test_results: ${profile.test_results.join(', ')}
- Examination types: ${profile.examination_types.join(', ')}
- Document validation: ${profile.validation_stats.validation_rate}% validated (${profile.validation_stats.validated_documents}/${profile.validation_stats.total_documents})

SEMANTIC SEARCH CAPABILITY:
- Rich extracted_data JSONB fields in documents table
- Raw document content searchable via extracted_data->'raw_content'
- Structured medical data in extracted_data->'structured_data'

CORE TABLES:
1. patients - Worker/patient records
   - Organization filtering: organization_id = '{organizationId}' OR client_organization_id IN ({clientOrganizationIds})

2. medical_examinations - Medical examination records  
   - Links to patients via patient_id
   - Contains: fitness_status, examination_date, expiry_date, job_title, company_name
   - Restrictions stored as array

3. medical_test_results - Individual test results
   - Links to examinations via examination_id
   - Contains: test_type, test_result, test_done, notes

4. documents - Document storage with validation tracking
   - Contains: extracted_data (JSONB), validation_status, file_name
   - Semantic search available on extracted_data fields

5. certificate_compliance - Compliance tracking
   - Contains: current_expiry_date, days_until_expiry, is_compliant

SECURITY RULES (CRITICAL):
- ALWAYS filter by: organization_id = '{organizationId}' OR client_organization_id IN ({clientOrganizationIds})
- Use proper JOINs between related tables
- Limit results appropriately

DATA QUALITY NOTES:
- Prioritize validated documents when searching extracted_data
- Use validation_status = 'validated' for highest quality results
- Provide data quality indicators in results
`;
  }

  private async performSemanticSearch(
    userQuery: string, 
    userContext: UserContext, 
    maxResults: number
  ): Promise<any> {
    console.log('Performing semantic search on documents...');
    
    const orgFilter = `organization_id.eq.${userContext.organizationId},client_organization_id.in.(${userContext.clientOrganizationIds.join(',')})`;
    
    try {
      // First try validated documents only
      const { data: validatedDocs, error: validatedError } = await this.supabase
        .from('documents')
        .select(`
          id, file_name, document_type, extracted_data, validation_status, owner_id,
          patients!inner(first_name, last_name, id_number)
        `)
        .or(orgFilter)
        .eq('validation_status', 'validated')
        .not('extracted_data', 'is', null)
        .limit(Math.ceil(maxResults * 0.7)); // 70% from validated

      let results = validatedDocs || [];
      let totalValidated = results.length;

      // If we need more results, get some unvalidated ones
      if (results.length < maxResults) {
        const remainingSlots = maxResults - results.length;
        
        const { data: unvalidatedDocs } = await this.supabase
          .from('documents')
          .select(`
            id, file_name, document_type, extracted_data, validation_status, owner_id,
            patients!inner(first_name, last_name, id_number)
          `)
          .or(orgFilter)
          .neq('validation_status', 'validated')
          .not('extracted_data', 'is', null)
          .limit(Math.min(remainingSlots, Math.ceil(maxResults * 0.3))); // Max 30% unvalidated

        results = [...results, ...(unvalidatedDocs || [])];
      }

      if (!results.length) {
        return {
          success: true,
          data: [],
          searchType: 'semantic',
          queryExplanation: 'No documents with extracted data found for semantic search',
          recommendation: 'Try uploading and processing more documents to improve search capabilities'
        };
      }

      // Filter results based on semantic relevance
      const relevantResults = results
        .filter(doc => {
          const extractedData = doc.extracted_data;
          if (!extractedData) return false;
          
          const searchText = [
            extractedData.raw_content || '',
            JSON.stringify(extractedData.structured_data || {}),
            doc.file_name
          ].join(' ').toLowerCase();
          
          const queryTerms = userQuery.toLowerCase().split(' ').filter(term => term.length > 2);
          return queryTerms.some(term => searchText.includes(term));
        })
        .slice(0, maxResults)
        .map(doc => ({
          file_name: doc.file_name,
          document_type: doc.document_type,
          patient_name: doc.patients ? `${doc.patients.first_name} ${doc.patients.last_name}` : 'Unknown',
          patient_id_number: doc.patients?.id_number || 'N/A',
          data_quality: doc.validation_status,
          warning: doc.validation_status !== 'validated' ? 'May contain extraction errors - consider validating' : null,
          extracted_content: doc.extracted_data
        }));

      const qualityScore = relevantResults.length > 0 
        ? Math.round((relevantResults.filter(r => r.data_quality === 'validated').length / relevantResults.length) * 100)
        : 0;

      return {
        success: true,
        data: relevantResults,
        searchType: 'semantic',
        queryExplanation: `Semantic search across document content and extracted medical data`,
        dataQuality: {
          validatedResults: relevantResults.filter(r => r.data_quality === 'validated').length,
          unvalidatedResults: relevantResults.filter(r => r.data_quality !== 'validated').length,
          qualityScore,
          warning: qualityScore < 70 ? 'Consider validating more documents for higher quality results' : null
        },
        recommendation: qualityScore < 50 
          ? 'Validate more documents to improve result accuracy and reliability'
          : 'Data quality is good - results are mostly from validated sources'
      };

    } catch (error) {
      console.error('Semantic search error:', error);
      return {
        success: false,
        error: 'Semantic search failed',
        searchType: 'semantic'
      };
    }
  }

  private async generateSQLWithEnhancedChatGPT(
    userQuery: string, 
    userContext: UserContext, 
    profile: DataProfile
  ): Promise<string> {
    const clientIds = userContext.clientOrganizationIds
      .filter(id => id && id.trim() !== '')
      .map(id => `'${id}'`)
      .join(',');

    const systemPrompt = `You are an expert SQL generator for a medical/occupational health database. Generate ONLY the SQL query, no explanations.

${this.getEnhancedSchemaContext(profile)}

CRITICAL SECURITY:
- Organization ID: ${userContext.organizationId}
- Client Organization IDs: [${clientIds}]
- ALWAYS include: (organization_id = '${userContext.organizationId}' OR client_organization_id IN (${clientIds || `'${userContext.organizationId}'`}))

INTELLIGENT QUERY MAPPING:
If user asks for terms not in actual data:
- "unfit" or "failed" → look for fit_with_restriction or abnormal results
- "vision problems" → test_type = 'vision' OR test_type LIKE '%vision%' 
- "expired" → expiry_date < CURRENT_DATE
- "expiring soon" → expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

QUERY OPTIMIZATION:
1. Use proper JOINs between related tables
2. Include meaningful column aliases
3. Order results logically (recent first for dates)
4. Limit to reasonable numbers (${Math.min(100, profile.validation_stats.total_documents || 50)})
5. Handle NULL values with COALESCE
6. Use efficient WHERE clauses

VALIDATION-AWARE QUERIES:
- For document searches, prioritize validation_status = 'validated'
- Include validation status in results when querying documents
- Provide data quality context

Generate ONLY the SQL query for: "${userQuery}"`;

    try {
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
          max_tokens: 1500
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedSQL = data.choices[0].message.content.trim();
      
      return generatedSQL.replace(/```sql\n?|\n?```/g, '').trim();
    } catch (error) {
      console.error('ChatGPT SQL generation error:', error);
      throw error;
    }
  }

  async processQuery(queryRequest: QueryRequest): Promise<any> {
    const { query, userContext, maxResults = 100 } = queryRequest;

    try {
      console.log('Processing enhanced ChatGPT query:', query);
      
      if (!this.openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      if (!userContext.organizationId || !query.trim()) {
        throw new Error('Invalid request parameters');
      }

      // Get data profile for intelligent query generation
      const profile = await this.getDataProfile(userContext.organizationId, userContext.clientOrganizationIds);

      // Try structured SQL query first
      let structuredResult;
      try {
        const sqlQuery = await this.generateSQLWithEnhancedChatGPT(query, userContext, profile);
        console.log('Generated enhanced SQL:', sqlQuery);

        const { data, error } = await this.supabase.rpc('execute_secure_query', {
          query_sql: sqlQuery,
          max_results: maxResults
        });

        if (error) {
          console.error('SQL execution error:', error);
          throw new Error(`SQL execution failed: ${error.message}`);
        }

        structuredResult = {
          success: true,
          data: data?.data || [],
          rowCount: data?.row_count || 0,
          queryExplanation: `AI-generated structured query: "${query}"`,
          executedSQL: sqlQuery,
          searchType: 'structured'
        };

        // If we got good results, return them
        if (structuredResult.data && structuredResult.data.length > 0) {
          return {
            ...structuredResult,
            suggestedQueries: this.getSuggestedQueries(profile),
            dataProfile: {
              validation_rate: profile.validation_stats.validation_rate,
              total_documents: profile.validation_stats.total_documents
            }
          };
        }
      } catch (sqlError) {
        console.log('Structured query failed, trying semantic search:', sqlError.message);
      }

      // Fallback to semantic search if no structured results
      const semanticResult = await this.performSemanticSearch(query, userContext, maxResults);
      
      if (semanticResult.success && semanticResult.data.length > 0) {
        return {
          ...semanticResult,
          suggestedQueries: this.getSuggestedQueries(profile)
        };
      }

      // If both failed, return helpful error with suggestions
      return {
        success: false,
        error: 'No results found for your query',
        queryExplanation: `Tried both structured database search and semantic document search`,
        suggestion: 'Try rephrasing your query or use one of the suggested examples',
        suggestedQueries: this.getSuggestedQueries(profile),
        dataProfile: {
          validation_rate: profile.validation_stats.validation_rate,
          total_documents: profile.validation_stats.total_documents,
          available_data: {
            fitness_statuses: profile.fitness_statuses,
            test_types: profile.test_types.slice(0, 5),
            examination_types: profile.examination_types
          }
        }
      };

    } catch (error) {
      console.error('Enhanced query processing error:', error);
      return {
        success: false,
        error: error.message || 'Query processing failed',
        suggestedQueries: this.getSuggestedQueries(),
        hint: "Try using simpler terms or check the suggested examples"
      };
    }
  }

  private getSuggestedQueries(profile?: DataProfile): string[] {
    const base = [
      "Show me patients with expired certificates",
      "Find all medical examinations from last month",
      "List workers needing follow-up actions",
      "Show documents pending validation",
      "Find workers with expiring certificates next month"
    ];

    if (profile) {
      const dynamic = [];
      
      if (profile.test_types.includes('vision')) {
        dynamic.push("Show vision test results");
      }
      if (profile.test_types.includes('hearing')) {
        dynamic.push("Find hearing test failures");
      }
      if (profile.fitness_statuses.includes('fit_with_restriction')) {
        dynamic.push("List workers with restrictions");
      }
      if (profile.validation_stats.validation_rate < 80) {
        dynamic.push("Show unvalidated documents needing review");
      }

      return [...dynamic, ...base].slice(0, 8);
    }

    return base;
  }
}

serve(async (req) => {
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
    
    console.log('Enhanced ChatGPT natural language query request received');
    console.log('Organization ID:', queryRequest.userContext?.organizationId);
    console.log('Query:', queryRequest.query);
    
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

    const processor = new EnhancedChatGPTQueryProcessor();
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
