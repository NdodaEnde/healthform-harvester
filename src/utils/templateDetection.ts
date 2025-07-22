
// src/utils/templateDetection.ts
// Shared Template Detection Utility - Single Source of Truth

interface DetectionResult {
  template: 'modern' | 'historical';
  confidence: number;
  reasoning: string;
  detectedFeatures: {
    hasSignature: boolean;
    hasStamp: boolean;
    hasPracticeNumber: boolean;
    hasPhysicalSignatureIndicators: boolean;
  };
}

/**
 * Master template detection function - used by all components
 * Eliminates duplicate detection logic and race conditions
 */
export function detectTemplateType(document: any): DetectionResult {
  console.log('🔍 [Template Detection] Starting detection for document:', document.id);
  
  const extractedData = document.extracted_data as any;
  
  // Initialize detection features
  const features = {
    hasSignature: false,
    hasStamp: false,
    hasPracticeNumber: false,
    hasPhysicalSignatureIndicators: false
  };
  
  let confidence = 0;
  let reasoning = '';
  
  // Check for signature indicators from structured data
  if (extractedData?.structured_data?.certificate_info?.signature === true) {
    features.hasSignature = true;
    confidence += 30;
    console.log('✅ [Template Detection] Found signature from structured data');
  }
  
  // Check for stamp indicators from structured data
  if (extractedData?.structured_data?.certificate_info?.stamp === true) {
    features.hasStamp = true;
    confidence += 30;
    console.log('✅ [Template Detection] Found stamp from structured data');
  }
  
  // Check raw content for signature/stamp keywords
  const rawContent = extractedData?.raw_content?.toLowerCase() || '';
  
  // Enhanced signature detection keywords
  const signatureKeywords = [
    'signature:',
    'handwritten signature',
    'stylized flourish',
    'placed above the printed word "signature"',
    'overlapping strokes',
    'signature consists of',
    'tall, looping, and angular strokes',
    'handwriting & style',
    'multiple overlapping lines',
    'horizontal flourish'
  ];
  
  if (signatureKeywords.some(keyword => rawContent.includes(keyword))) {
    features.hasPhysicalSignatureIndicators = true;
    confidence += 15;
    console.log('✅ [Template Detection] Found signature keywords in raw content');
  }
  
  // Enhanced stamp detection keywords
  const stampKeywords = [
    'stamp:',
    'rectangular black stamp',
    'practice no',
    'practice number',
    'practice no.',
    'practice no:',
    'sanc no',
    'sanc number',
    'sasohn no',
    'mp no',
    'mp number',
    'black stamp',
    'official stamp',
    'hpcsa',
    'with partial text and date'
  ];
  
  if (stampKeywords.some(keyword => rawContent.includes(keyword))) {
    features.hasPracticeNumber = true;
    confidence += 25;
    console.log('✅ [Template Detection] Found stamp keywords in raw content');
  }
  
  // Determine template based on confidence scoring
  const threshold = 20; // Minimum confidence for historical template
  const template: 'modern' | 'historical' = confidence >= threshold ? 'historical' : 'modern';
  
  // Generate human-readable reasoning
  const detectedFeaturesList = [];
  if (features.hasSignature) detectedFeaturesList.push('digital signature data');
  if (features.hasStamp) detectedFeaturesList.push('stamp data');
  if (features.hasPhysicalSignatureIndicators) detectedFeaturesList.push('signature keywords');
  if (features.hasPracticeNumber) detectedFeaturesList.push('practice number/stamp keywords');
  
  if (detectedFeaturesList.length > 0) {
    reasoning = `Found ${detectedFeaturesList.join(', ')} → Historical template recommended`;
  } else {
    reasoning = 'No signature/stamp indicators found → Modern template recommended';
  }
  
  const result: DetectionResult = {
    template,
    confidence,
    reasoning,
    detectedFeatures: features
  };
  
  console.log('🎯 [Template Detection] Result:', result);
  return result;
}

/**
 * Get effective template considering saved preferences
 */
export function getEffectiveTemplate(document: any, manualOverride?: 'modern' | 'historical'): {
  template: 'modern' | 'historical';
  source: 'saved' | 'auto-detected' | 'manual-override';
  detection: DetectionResult;
} {
  const extractedData = document.extracted_data as any;
  const detection = detectTemplateType(document);
  
  // 1. HIGHEST PRIORITY: Previously saved template selection
  if (extractedData?.template_selection?.selected_template) {
    console.log('📁 [Template Selection] Using saved template:', extractedData.template_selection.selected_template);
    return {
      template: extractedData.template_selection.selected_template,
      source: 'saved',
      detection
    };
  }
  
  // 2. SECOND PRIORITY: Manual override (when user explicitly selects)
  if (manualOverride) {
    console.log('✋ [Template Selection] Using manual override:', manualOverride);
    return {
      template: manualOverride,
      source: 'manual-override',
      detection
    };
  }
  
  // 3. DEFAULT: Auto-detected template
  console.log('🤖 [Template Selection] Using auto-detected template:', detection.template);
  return {
    template: detection.template,
    source: 'auto-detected',
    detection
  };
}

/**
 * Enhanced detection with caching to prevent duplicate runs
 */
const detectionCache = new Map<string, DetectionResult>();

export function detectTemplateTypeCached(document: any): DetectionResult {
  const cacheKey = `${document.id}-${document.updated_at || document.created_at}`;
  
  if (detectionCache.has(cacheKey)) {
    console.log('💾 [Template Detection] Using cached result for:', document.id);
    return detectionCache.get(cacheKey)!;
  }
  
  const result = detectTemplateType(document);
  detectionCache.set(cacheKey, result);
  return result;
}

/**
 * Clear cache for a specific document (useful when document is updated)
 */
export function clearDetectionCache(documentId: string) {
  const keysToDelete = [];
  for (const key of detectionCache.keys()) {
    if (key.startsWith(documentId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => detectionCache.delete(key));
  console.log('🗑️ [Template Detection] Cleared cache for document:', documentId);
}

export type { DetectionResult };
