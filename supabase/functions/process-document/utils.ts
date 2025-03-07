
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
  // Look for the pattern where label is followed by [x] or preceded by [x]
  const patterns = [
    new RegExp(`${label}\\s*:\\s*\\[x\\]`, 'i'),
    new RegExp(`${label}\\s*:\\s*\\[X\\]`, 'i'),
    new RegExp(`\\[x\\]\\s*${label}`, 'i'),
    new RegExp(`\\[X\\]\\s*${label}`, 'i'),
    new RegExp(`\\- \\*\\*${label}\\*\\*:\\s*\\[x\\]`, 'i'),
    new RegExp(`\\- \\*\\*${label}\\*\\*:\\s*\\[X\\]`, 'i'),
    // For table formats
    new RegExp(`<td>${label}<\\/td>\\s*<td>\\[x\\]<\\/td>`, 'i'),
    new RegExp(`<td>${label}<\\/td>\\s*<td>\\[X\\]<\\/td>`, 'i'),
    // For typical form formats
    new RegExp(`<tr>\\s*<th>${label}<\\/th>[\\s\\S]*?<td>\\[x\\]<\\/td>`, 'i'),
    new RegExp(`<tr>\\s*<th>${label}<\\/th>[\\s\\S]*?<td>\\[X\\]<\\/td>`, 'i'),
    // For other formats
    new RegExp(`${label}[\\s\\S]*?\\[x\\]`, 'i'),
    new RegExp(`${label}[\\s\\S]*?\\[X\\]`, 'i'),
    // Look for cases where a row has the label and includes [x] in the same tr element
    new RegExp(`<tr>[\\s\\S]*?${label}[\\s\\S]*?\\[x\\][\\s\\S]*?<\\/tr>`, 'i'),
    new RegExp(`<tr>[\\s\\S]*?${label}[\\s\\S]*?\\[X\\][\\s\\S]*?<\\/tr>`, 'i')
  ];
  
  // Check all patterns
  for (const pattern of patterns) {
    if (pattern.test(markdown)) {
      console.log(`Found checked pattern for ${label}`);
      return true;
    }
  }
  
  // For more complex tables, check table sections
  if (markdown.includes(`<table>`) && markdown.includes(label)) {
    // Extract all table sections
    const tableSections = markdown.match(/<table>[\s\S]*?<\/table>/g) || [];
    
    for (const tableSection of tableSections) {
      if (tableSection.includes(label)) {
        // Look for [x] in the rows that follow
        if (tableSection.includes('[x]') || tableSection.includes('[X]')) {
          // Try to determine if the [x] corresponds to this label
          const rows = tableSection.match(/<tr>[\s\S]*?<\/tr>/g) || [];
          
          // Locate header row with the label
          let labelColumnIndex = -1;
          for (let i = 0; i < rows.length; i++) {
            const headerCells = rows[i].match(/<th>(.*?)<\/th>/g) || [];
            for (let j = 0; j < headerCells.length; j++) {
              if (headerCells[j].includes(label)) {
                labelColumnIndex = j;
                break;
              }
            }
            if (labelColumnIndex >= 0) break;
          }
          
          // If we found the column, check the data rows for [x]
          if (labelColumnIndex >= 0) {
            // Look at data rows (usually after header row)
            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].match(/<td>(.*?)<\/td>/g) || [];
              if (cells.length > labelColumnIndex) {
                if (cells[labelColumnIndex].includes('[x]') || cells[labelColumnIndex].includes('[X]')) {
                  console.log(`Found checked pattern for ${label} in table at column ${labelColumnIndex}`);
                  return true;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return false;
}
