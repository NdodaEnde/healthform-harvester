
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wgkbsiczgyaqmgoyirjs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2JzaWN6Z3lhcW1nb3lpcmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODQ3NjcsImV4cCI6MjA1NTk2MDc2N30.WVI1UFFrL5A0_jYt-j7BDZJtzqHqnb5PXHZSGKr6qxE";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage
    },
    global: {
      fetch: fetch
    },
    db: {
      schema: 'public'
    },
    // Storage configuration focused on medical-documents bucket
    storage: {
      detectContentType: true
    }
  }
);

// Helper to handle typecasting for Supabase queries
export const safeQueryResult = <T>(data: any): T => {
  // This function helps with TypeScript casting of query results
  return data as T;
};

// Helper to check if result has error
export const isQueryError = (result: any): boolean => {
  return result && 'error' in result && result.error !== null;
};

// Helper to safely access document properties with type checking
export const safeDocumentAccess = (document: any) => {
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
    organization_id: document.organization_id || null,
    client_organization_id: document.client_organization_id || null,
    certificates: document.certificates || [],
  };
};
