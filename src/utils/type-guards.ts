
/**
 * Utility functions for TypeScript type checking and type guards
 */

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Type guard for database results - checks if the result is not an error
 */
export function isDataResult<T>(result: any): result is T {
  return result && 
    !hasProperty(result, 'error') && 
    (Array.isArray(result) || typeof result === 'object');
}

/**
 * Safe access for document properties with type conversion
 */
export function safeDocumentData(document: any): any {
  if (!document || typeof document !== 'object') return null;
  
  return {
    id: document.id || null,
    document_type: document.document_type || 'unknown',
    file_name: document.file_name || 'Unnamed document',
    status: document.status || 'unknown',
    created_at: document.created_at || null,
    public_url: document.public_url || null,
    extracted_data: document.extracted_data || null,
    owner_id: document.owner_id || null,
  };
}

/**
 * Safely cast query result to avoid TypeScript errors
 */
export function safeCast<T>(data: any): T {
  return data as T;
}
