
import { useToast as useHookToast, toast as hookToast } from "@/hooks/use-toast";

// Helper function to clean HTML comments and metadata from extracted values
export const cleanExtractedValue = (value: string | null | undefined): string => {
  if (!value) return '';
  
  // Remove HTML comments: <!-- ... -->
  let cleaned = value.replace(/<!--.*?-->/g, '').trim();
  
  // Also remove form bounding box coordinates and IDs
  cleaned = cleaned.replace(/<!\-\- \w+, from page \d+ \(.*?\), with ID .*? \-\->/g, '').trim();
  
  // Remove coordinates directly in text (l=0.064,t=0.188,r=0.936,b=0.284)
  cleaned = cleaned.replace(/\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)/g, '').trim();
  
  // Remove IDs in text - with ID 5d5dece1-814c-40b8-ac21-2d9877814985
  cleaned = cleaned.replace(/with ID [a-f0-9\-]+/g, '').trim();
  
  // Clean up any remaining <!-- or --> fragments
  cleaned = cleaned.replace(/<!--|-->/g, '').trim();
  
  return cleaned;
};

export { useHookToast as useToast, hookToast as toast };
