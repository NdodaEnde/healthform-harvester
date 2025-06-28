
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SectionDetectionResult {
  section_type: string;
  section_name: string;
  page_range: string;
  confidence: number;
  extracted_content?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, documentUrl, pages } = await req.json();

    if (!documentId || !documentUrl) {
      throw new Error('Document ID and URL are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing compound document: ${documentId}`);

    // Update document status to processing
    await supabase
      .from('compound_documents')
      .update({ 
        status: 'processing',
        processing_metadata: {
          started_at: new Date().toISOString(),
          processor_version: '1.0'
        }
      })
      .eq('id', documentId);

    // Simulate AI section detection
    const detectedSections = await detectDocumentSections(documentUrl, pages);

    // Update document with detected sections
    const { error: updateError } = await supabase
      .from('compound_documents')
      .update({
        status: 'completed',
        detected_sections: detectedSections,
        processing_metadata: {
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          processor_version: '1.0',
          sections_detected: detectedSections.length,
          processing_time_ms: 5000 // Mock processing time
        }
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    // Create individual section records
    for (const section of detectedSections) {
      await supabase
        .from('compound_document_sections')
        .insert({
          compound_document_id: documentId,
          section_type: section.section_type,
          section_name: section.section_name,
          page_range: section.page_range,
          processing_confidence: section.confidence,
          validation_status: section.confidence > 0.8 ? 'validated' : 'requires_review',
          requires_review: section.confidence < 0.8,
          extracted_data: section.extracted_content ? { content: section.extracted_content } : null
        });
    }

    console.log(`Successfully processed document ${documentId} with ${detectedSections.length} sections`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        sectionsDetected: detectedSections.length,
        sections: detectedSections
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error processing document:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function detectDocumentSections(documentUrl: string, pages: number): Promise<SectionDetectionResult[]> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock AI section detection results
  const possibleSections = [
    {
      section_type: 'medical_questionnaire',
      section_name: 'Medical History Questionnaire',
      confidence: 0.95,
      typical_pages: '1-2'
    },
    {
      section_type: 'vision_test',
      section_name: 'Vision Screening Results',
      confidence: 0.88,
      typical_pages: '3'
    },
    {
      section_type: 'hearing_test',
      section_name: 'Audiometry Test Results',
      confidence: 0.92,
      typical_pages: '4'
    },
    {
      section_type: 'lung_function',
      section_name: 'Pulmonary Function Test',
      confidence: 0.87,
      typical_pages: '5-6'
    },
    {
      section_type: 'physical_examination',
      section_name: 'Physical Examination Report',
      confidence: 0.93,
      typical_pages: '7-8'
    },
    {
      section_type: 'drug_screen',
      section_name: 'Drug and Alcohol Screening',
      confidence: 0.91,
      typical_pages: '9'
    },
    {
      section_type: 'x_ray_report',
      section_name: 'Chest X-Ray Report',
      confidence: 0.89,
      typical_pages: '10-11'
    },
    {
      section_type: 'fitness_declaration',
      section_name: 'Fitness for Work Declaration',
      confidence: 0.96,
      typical_pages: '12'
    }
  ];

  // Randomly select sections based on document pages
  const sectionsToInclude = Math.min(pages, possibleSections.length);
  const selectedSections = possibleSections
    .sort(() => Math.random() - 0.5)
    .slice(0, sectionsToInclude);

  return selectedSections.map((section, index) => ({
    section_type: section.section_type,
    section_name: section.section_name,
    page_range: section.typical_pages,
    confidence: section.confidence + (Math.random() * 0.1 - 0.05), // Add some variance
    extracted_content: `Sample extracted content for ${section.section_name}`
  }));
}
