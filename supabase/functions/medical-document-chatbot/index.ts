
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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

class MedicalDocumentChatbot {
  private supabase;
  private openAIApiKey: string;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  }

  async processQuery(queryRequest: QueryRequest) {
    const { query, userContext, maxResults = 20 } = queryRequest;

    try {
      console.log('Processing medical document query:', query);

      if (!this.openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      if (!userContext.organizationId) {
        throw new Error('Organization ID is required');
      }

      // Step 1: Find relevant medical documents
      const relevantDocuments = await this.findRelevantMedicalDocuments(query, userContext, maxResults);
      
      if (relevantDocuments.length === 0) {
        return {
          success: true,
          answer: "I couldn't find any medical documents containing information relevant to your query. Try asking about specific medical tests, patient names, or health conditions.",
          reasoning: "No documents matched the search terms in your question.",
          supporting_documents: [],
          documentCount: 0,
          searchType: 'medical_document_semantic',
          suggestedQueries: this.getMedicalSuggestions(),
          hint: "Try broader medical terms like 'vision tests', 'drug screening', or 'worker fitness'"
        };
      }

      // Step 2: Prepare evidence for ChatGPT analysis
      const medicalEvidence = this.prepareMedicalEvidence(relevantDocuments);

      // Step 3: Get intelligent analysis from ChatGPT
      const result = await this.getMedicalAnswerFromChatGPT(query, medicalEvidence);

      return {
        success: true,
        ...result,
        documentCount: relevantDocuments.length,
        searchType: 'medical_document_semantic',
        suggestedQueries: this.getMedicalSuggestions()
      };

    } catch (error) {
      console.error('Medical document query error:', error);
      return {
        success: false,
        error: error.message,
        suggestedQueries: this.getMedicalSuggestions(),
        hint: "Please try rephrasing your question using medical terms"
      };
    }
  }

  private async findRelevantMedicalDocuments(query: string, userContext: UserContext, maxResults: number) {
    console.log('Searching for relevant medical documents...');

    try {
      // Build organization filter
      const clientIds = userContext.clientOrganizationIds.join(',');
      const orgFilter = clientIds 
        ? `organization_id.eq.${userContext.organizationId},client_organization_id.in.(${clientIds})`
        : `organization_id.eq.${userContext.organizationId}`;

      // Extract medical search terms
      const searchTerms = this.extractMedicalSearchTerms(query);
      console.log('Medical search terms:', searchTerms);

      // Query documents with extracted data
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select(`
          id, file_name, document_type, extracted_data, created_at, validation_status,
          patients(first_name, last_name, id_number, date_of_birth)
        `)
        .or(orgFilter)
        .not('extracted_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error querying documents:', error);
        throw error;
      }

      // Filter documents by medical relevance
      const relevantDocs = this.filterByMedicalRelevance(documents || [], searchTerms, query);

      // Return top matches, prioritizing validated documents
      const sortedDocs = relevantDocs
        .sort((a, b) => {
          // Prioritize validated documents
          if (a.validation_status === 'validated' && b.validation_status !== 'validated') return -1;
          if (b.validation_status === 'validated' && a.validation_status !== 'validated') return 1;
          // Then by relevance score
          return b.relevanceScore - a.relevanceScore;
        })
        .slice(0, maxResults);

      console.log(`Found ${sortedDocs.length} relevant medical documents`);
      return sortedDocs;

    } catch (error) {
      console.error('Error in findRelevantMedicalDocuments:', error);
      throw error;
    }
  }

  private extractMedicalSearchTerms(query: string): string[] {
    const lowercaseQuery = query.toLowerCase();
    const medicalTerms = new Set<string>();

    // Medical examination types
    const examTypes = ['vision', 'hearing', 'drug', 'screen', 'test', 'examination', 'medical', 'fitness', 'certificate', 'physical'];
    
    // Test results and status
    const statusTerms = ['fit', 'unfit', 'pass', 'fail', 'normal', 'abnormal', 'positive', 'negative', 'clear', 'restriction'];
    
    // Body systems and tests
    const medicalTermsList = ['blood', 'urine', 'lung', 'heart', 'eye', 'ear', 'pressure', 'sugar', 'cholesterol'];
    
    // Conditions and follow-up
    const conditionTerms = ['follow', 'recheck', 'monitor', 'condition', 'problem', 'issue', 'concern'];

    // Add matching terms
    [...examTypes, ...statusTerms, ...medicalTermsList, ...conditionTerms].forEach(term => {
      if (lowercaseQuery.includes(term)) {
        medicalTerms.add(term);
      }
    });

    // Add potential patient names or specific terms (words longer than 2 chars)
    const words = query.split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => medicalTerms.add(word.toLowerCase()));

    return Array.from(medicalTerms);
  }

  private filterByMedicalRelevance(documents: any[], searchTerms: string[], originalQuery: string) {
    return documents
      .map(doc => {
        const relevanceScore = this.calculateMedicalRelevance(doc.extracted_data, searchTerms, originalQuery);
        return { ...doc, relevanceScore };
      })
      .filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateMedicalRelevance(extractedData: any, searchTerms: string[], originalQuery: string): number {
    if (!extractedData) return 0;

    let score = 0;
    const queryLower = originalQuery.toLowerCase();

    // Prepare content for searching
    const rawContent = (extractedData.raw_content || '').toLowerCase();
    const structuredContent = JSON.stringify(extractedData.structured_data || {}).toLowerCase();
    const certificateContent = JSON.stringify(extractedData.certificate_info || {}).toLowerCase();

    // Score based on search terms
    searchTerms.forEach(term => {
      const termLower = term.toLowerCase();
      
      // Raw content matches (OCR text)
      const rawMatches = (rawContent.match(new RegExp(termLower, 'g')) || []).length;
      score += rawMatches * 1;

      // Structured data matches (more valuable)
      const structuredMatches = (structuredContent.match(new RegExp(termLower, 'g')) || []).length;
      score += structuredMatches * 3;

      // Certificate info matches (highly valuable)
      const certMatches = (certificateContent.match(new RegExp(termLower, 'g')) || []).length;
      score += certMatches * 5;
    });

    // Bonus for exact phrase matches in any content
    const allContent = [rawContent, structuredContent, certificateContent].join(' ');
    if (allContent.includes(queryLower)) {
      score += 10;
    }

    // Bonus for medical document types
    const medicalTypes = ['medical', 'certificate', 'examination', 'fitness', 'health'];
    const docType = (extractedData.document_type || '').toLowerCase();
    if (medicalTypes.some(type => docType.includes(type))) {
      score += 2;
    }

    return score;
  }

  private prepareMedicalEvidence(documents: any[]) {
    const evidence: any = {};

    documents.forEach((doc, index) => {
      const key = `document_${index + 1}`;
      
      evidence[key] = {
        filename: doc.file_name,
        document_type: doc.document_type,
        patient_info: doc.patients ? {
          name: `${doc.patients.first_name} ${doc.patients.last_name}`,
          id_number: doc.patients.id_number,
          date_of_birth: doc.patients.date_of_birth
        } : null,
        medical_data: {
          structured_data: doc.extracted_data?.structured_data || {},
          raw_content: (doc.extracted_data?.raw_content || '').substring(0, 2000),
          certificate_info: doc.extracted_data?.certificate_info || {}
        },
        validation_status: doc.validation_status,
        created_date: doc.created_at,
        relevance_score: doc.relevanceScore,
        document_id: doc.id
      };
    });

    return evidence;
  }

  private async getMedicalAnswerFromChatGPT(query: string, evidence: any) {
    const prompt = `You are a medical document analysis expert specializing in occupational health records. Analyze the provided medical documents and answer the user's question.

IMPORTANT INSTRUCTIONS:
1. Base your answer ONLY on the medical evidence provided
2. If information is missing or unclear, state this explicitly
3. Consider validation status (validated documents are more reliable)
4. Focus on occupational health: fitness for work, test results, medical restrictions
5. Provide specific references to documents and patients when possible

Return your response in JSON format with these keys:
{
  "answer": "Comprehensive answer based on medical evidence",
  "reasoning": "Step-by-step medical reasoning process",
  "supporting_documents": [
    {
      "document_key": "document_1",
      "filename": "actual_filename.pdf", 
      "patient_name": "Patient Name",
      "relevant_findings": ["Specific medical findings that support the answer"],
      "confidence": 8,
      "validation_status": "validated"
    }
  ],
  "medical_summary": "Brief summary of key medical findings",
  "recommendations": ["Any recommendations based on the findings"]
}

User Question: ${query}

Medical Evidence:
${JSON.stringify(evidence, null, 2)}

Remember: Only reference information that actually appears in the provided evidence.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a medical document analysis expert. Provide accurate, evidence-based answers about occupational health records.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      let rawResponse = data.choices[0].message.content.trim();

      // Clean up JSON formatting
      if (rawResponse.startsWith('```json')) {
        rawResponse = rawResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }

      const parsedResponse = JSON.parse(rawResponse);
      return parsedResponse;

    } catch (error) {
      console.error('Error getting medical answer from ChatGPT:', error);
      return {
        answer: "I encountered an error while analyzing the medical documents. Please try rephrasing your question.",
        reasoning: `Analysis error: ${error.message}`,
        supporting_documents: [],
        medical_summary: "Unable to analyze medical data due to processing error",
        recommendations: ["Please try rephrasing your question or contact support"]
      };
    }
  }

  private getMedicalSuggestions(): string[] {
    return [
      "Show me workers with vision test results",
      "Find patients with hearing test abnormalities", 
      "What are the drug screening results for recent examinations?",
      "Which workers have fitness restrictions?",
      "Show me expired medical certificates",
      "Find workers who need follow-up medical care",
      "What medical conditions were found in recent exams?",
      "Show me compliance status for workers",
      "Find all blood pressure test results",
      "Which workers passed their physical examinations?"
    ];
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
    console.log('Medical document chatbot request received');
    console.log('Query:', queryRequest.query);
    console.log('Organization:', queryRequest.userContext?.organizationId);

    if (!queryRequest.userContext?.organizationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Organization ID required'
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

    const chatbot = new MedicalDocumentChatbot();
    const result = await chatbot.processQuery(queryRequest);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Medical document chatbot error:', error);
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
