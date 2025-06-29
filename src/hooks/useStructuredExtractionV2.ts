
import { useFeatureFlag } from './useFeatureFlags';

export function useStructuredExtractionV2() {
  const { isEnabled, loading, source } = useFeatureFlag('structured_extraction_v2');
  
  return {
    isEnabled,
    loading,
    source,
    shouldUseV2: isEnabled && !loading
  };
}

// Rollout percentage hook for gradual migration
export function useStructuredExtractionRollout() {
  const { isEnabled: v2Enabled } = useStructuredExtractionV2();
  const { isEnabled: rolloutEnabled } = useFeatureFlag('structured_extraction_rollout');
  
  // Generate a consistent percentage based on user/session
  const getUserRolloutPercentage = () => {
    const sessionId = sessionStorage.getItem('rollout_id') || 
                     Math.random().toString(36).substring(7);
    
    if (!sessionStorage.getItem('rollout_id')) {
      sessionStorage.setItem('rollout_id', sessionId);
    }
    
    // Convert session ID to a number between 0-100
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      const char = sessionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  };
  
  const rolloutPercentage = 25; // Start with 25% rollout
  const userPercentage = getUserRolloutPercentage();
  
  const shouldUseV2 = v2Enabled && 
                      rolloutEnabled && 
                      userPercentage < rolloutPercentage;
  
  return {
    shouldUseV2,
    rolloutPercentage,
    userPercentage,
    isInRollout: rolloutEnabled
  };
}
