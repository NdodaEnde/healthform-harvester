
// Compound Documents Module Exports
export { default as CompoundDocumentsList } from './CompoundDocumentsList';
export { default as FeatureFlagBanner } from './FeatureFlagBanner';
export { default as CompoundDocumentUploader } from './CompoundDocumentUploader';
export { default as SectionEditor } from './SectionEditor';
export { default as WorkflowAssignmentPanel } from './WorkflowAssignmentPanel';
export { default as CompoundDocumentDetail } from './CompoundDocumentDetail';

// New Phase 3 components
export { default as AIProcessingIndicator } from './AIProcessingIndicator';
export { default as CompoundDocumentAnalytics } from './CompoundDocumentAnalytics';
export { default as SmartWorkflowSuggestions } from './SmartWorkflowSuggestions';

// Phase 4 components
export { default as FeatureFlagManager } from './FeatureFlagManager';
export { default as FeatureFlagTestingPanel } from './FeatureFlagTestingPanel';

// Re-export hooks for convenience
export { useCompoundDocuments, useCompoundDocumentSections } from '@/hooks/useCompoundDocuments';
export { useFeatureFlags } from '@/hooks/useFeatureFlags';

// New hooks
export { useCompoundDocumentAnalytics } from '@/hooks/useCompoundDocumentAnalytics';
export { useAIWorkflowSuggestions } from '@/hooks/useAIWorkflowSuggestions';
