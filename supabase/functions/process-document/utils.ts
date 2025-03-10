
// Helper utilities for document processing

// Helper function to safely extract nested properties from an object
export function extractPath(obj: any, path: string): any {
  if (!obj) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Helper function to clean HTML comments from extracted values
export function cleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove HTML comments: <!-- ... -->
  let cleaned = value.replace(/\s*<!--.*?-->\s*/g, ' ').trim();
  
  // Also remove form bounding box coordinates and IDs
  cleaned = cleaned.replace(/\s*<!\-\- \w+, from page \d+ \(.*?\), with ID .*? \-\->\s*/g, ' ').trim();
  
  // Remove coordinates directly in text (l=0.064,t=0.188,r=0.936,b=0.284)
  cleaned = cleaned.replace(/\s*\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)\s*/g, ' ').trim();
  
  // Remove IDs in text - with ID 5d5dece1-814c-40b8-ac21-2d9877814985
  cleaned = cleaned.replace(/\s*with ID [a-f0-9\-]+\s*/g, ' ').trim();
  
  // Clean up any remaining <!-- or --> fragments
  cleaned = cleaned.replace(/<!--|-->/g, '').trim();
  
  // Clean up HTML table data cells with empty brackets
  cleaned = cleaned.replace(/<td>\[\s*\]<\/td>/g, 'N/A').trim();
  
  // Handle N/A values more consistently
  if (cleaned.match(/^N\/?A$/i) || cleaned === '[ ]' || cleaned === '[]') {
    return 'N/A';
  }
  
  return cleaned;
}

// Helper function to check if a condition exists in an array of conditions
export function checkCondition(data: any, path: string, condition: string): boolean {
  const conditions = extractPath(data, path);
  if (!Array.isArray(conditions)) return false;
  
  return conditions.some((item: string) => 
    typeof item === 'string' && item.toLowerCase().includes(condition.toLowerCase())
  );
}

// Helper function to check if a specific item is checked in the markdown
export function isChecked(markdown: string, label: string): boolean {
  // Look for patterns specific to the label rather than global checks
  // This focuses on finding '[x]' immediately adjacent to the specific label
  
  // Create a regex pattern for detecting label with [x] check
  const patterns = [
    // Direct label with checkbox format
    new RegExp(`\\- \\*\\*${label}\\*\\*:\\s*\\[x\\]`, 'i'),
    new RegExp(`\\- \\*\\*${label}\\*\\*:\\s*\\[X\\]`, 'i'),
    // Table format with label and checkbox in adjacent cells
    new RegExp(`<tr>[^<]*<td>[^<]*${label}[^<]*</td>[^<]*<td>\\[x\\]</td>`, 'i'),
    new RegExp(`<tr>[^<]*<td>[^<]*${label}[^<]*</td>[^<]*<td>\\[X\\]</td>`, 'i')
  ];
  
  // Check if any of the patterns match the markdown
  for (const pattern of patterns) {
    if (pattern.test(markdown)) {
      console.log(`Found checked pattern for ${label}`);
      return true;
    }
  }
  
  return false;
}
