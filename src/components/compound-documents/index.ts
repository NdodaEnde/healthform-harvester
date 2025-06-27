
// Compound Documents Module Exports
export { default as CompoundDocumentsList } from './CompoundDocumentsList';
export { default as FeatureFlagBanner } from './FeatureFlagBanner';
export { default as CompoundDocumentUploader } from './CompoundDocumentUploader';
export { default as SectionEditor } from './SectionEditor';
export { default as WorkflowAssignmentPanel } from './WorkflowAssignmentPanel';
export { default as CompoundDocumentDetail } from './CompoundDocumentDetail';

// Re-export hooks for convenience
export { useCompoundDocuments, useCompoundDocumentSections } from '@/hooks/useCompoundDocuments';
export { useFeatureFlags } from '@/hooks/useFeatureFlags';
