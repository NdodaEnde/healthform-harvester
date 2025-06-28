
import { useState, useEffect } from 'react';
import { CompoundDocument } from '@/types/compound-document';

interface WorkflowSuggestion {
  id: string;
  type: 'priority' | 'assignment' | 'optimization' | 'quality';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  action: {
    type: string;
    data: any;
  };
}

export function useAIWorkflowSuggestions(document: CompoundDocument) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [document.id, document.workflow_status]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const suggestions: WorkflowSuggestion[] = [];

    // Priority suggestions based on document complexity
    if (document.detected_sections.length > 5) {
      suggestions.push({
        id: 'priority-complex',
        type: 'priority',
        title: 'High Priority Processing Recommended',
        description: 'This document contains multiple complex sections that may require expert review. Consider expediting through the workflow.',
        impact: 'high',
        confidence: 0.85,
        action: {
          type: 'set_priority',
          data: { priority: 'high' }
        }
      });
    }

    // Assignment suggestions based on section types
    const medicalSections = document.detected_sections.filter(s => 
      ['medical_questionnaire', 'physical_examination'].includes(s.section_type)
    );
    
    if (medicalSections.length > 0 && document.workflow_status === 'receptionist_review') {
      suggestions.push({
        id: 'assign-nurse',
        type: 'assignment',
        title: 'Assign to Nurse for Medical Review',
        description: 'Document contains medical questionnaire and examination data that would benefit from nursing expertise.',
        impact: 'medium',
        confidence: 0.92,
        action: {
          type: 'assign_workflow',
          data: { step: 'nurse_review', role: 'nurse' }
        }
      });
    }

    // Quality suggestions based on confidence scores
    const lowConfidenceSections = document.detected_sections.filter(s => s.confidence < 0.7);
    if (lowConfidenceSections.length > 0) {
      suggestions.push({
        id: 'quality-review',
        type: 'quality',
        title: 'Manual Review Recommended',
        description: `${lowConfidenceSections.length} sections have low AI confidence scores. Manual validation recommended.`,
        impact: 'medium',
        confidence: 0.88,
        action: {
          type: 'flag_for_review',
          data: { sections: lowConfidenceSections.map(s => s.section_type) }
        }
      });
    }

    // Optimization suggestions
    if (document.workflow_status === 'tech_review' && !document.workflow_assignments['tech_review']) {
      suggestions.push({
        id: 'optimize-workflow',
        type: 'optimization',
        title: 'Skip Tech Review for Standard Document',
        description: 'This document follows standard patterns and could proceed directly to doctor approval, saving 2-3 hours.',
        impact: 'low',
        confidence: 0.75,
        action: {
          type: 'skip_step',
          data: { step: 'tech_review', reason: 'standard_document' }
        }
      });
    }

    setSuggestions(suggestions);
    setLoading(false);
  };

  const applySuggestion = async (suggestion: WorkflowSuggestion) => {
    console.log('Applying suggestion:', suggestion);
    // This would typically call an API to apply the suggestion
    // For now, we'll just simulate the action
    
    switch (suggestion.action.type) {
      case 'set_priority':
        console.log('Setting priority to:', suggestion.action.data.priority);
        break;
      case 'assign_workflow':
        console.log('Assigning to workflow step:', suggestion.action.data.step);
        break;
      case 'flag_for_review':
        console.log('Flagging sections for review:', suggestion.action.data.sections);
        break;
      case 'skip_step':
        console.log('Skipping workflow step:', suggestion.action.data.step);
        break;
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  return {
    suggestions,
    loading,
    applySuggestion,
    dismissSuggestion,
    refreshSuggestions: generateSuggestions
  };
}
