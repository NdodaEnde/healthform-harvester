
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
    new RegExp(`<tr>[\\s\\S]*?${label}[\\s\\S]*?\\[X\\][\\s\\S]*?<\\/tr>`, 'i'),
    // Look for checkmark symbols
    new RegExp(`${label}[\\s\\S]*?✓`, 'i'),
    new RegExp(`✓[\\s\\S]*?${label}`, 'i')
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
        if (tableSection.includes('[x]') || tableSection.includes('[X]') || tableSection.includes('✓')) {
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
                if (cells[labelColumnIndex].includes('[x]') || cells[labelColumnIndex].includes('[X]') || cells[labelColumnIndex].includes('✓')) {
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

// Check if a specific field exists and has a non-empty value
export function hasValue(data: any, fieldPath: string): boolean {
  const value = extractPath(data, fieldPath);
  return value !== undefined && value !== null && value !== '';
}

// Deep merge two objects with improved handling of arrays and non-object values
export function deepMergeObjects(target: any, source: any): any {
  // If either is not an object, return source
  if (typeof target !== 'object' || target === null || 
      typeof source !== 'object' || source === null) {
    return source;
  }
  
  // Create a copy of target to avoid mutation
  const output = { ...target };
  
  // Process all keys in source
  Object.keys(source).forEach(key => {
    // If key is an object in both target and source, merge recursively
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
        output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
      
      output[key] = deepMergeObjects(output[key], source[key]);
    } 
    // Special handling for structured_data to ensure we don't lose any fields
    else if (key === 'structured_data' && source[key] && typeof source[key] === 'object') {
      if (!output[key] || typeof output[key] !== 'object') {
        output[key] = {};
      }
      output[key] = deepMergeObjects(output[key], source[key]);
    }
    // For arrays or when the key exists only in source, copy from source
    else if (source[key] !== undefined && (
             Array.isArray(source[key]) || 
             source[key] !== null && 
             source[key] !== '')) {
      
      // Special handling for boolean-like strings
      if (typeof source[key] === 'string' && 
          (source[key].toLowerCase() === 'true' || source[key].toLowerCase() === 'false')) {
        output[key] = source[key].toLowerCase() === 'true';
      } else {
        output[key] = source[key];
      }
    }
  });
  
  return output;
}

// Normalize extracted data to ensure it has the expected structure for validation
export function normalizeExtractedData(extractedData: any): any {
  if (!extractedData) return { structured_data: {} };
  
  // Create a deep copy to avoid modifying the original
  const normalizedData = JSON.parse(JSON.stringify(extractedData));
  
  console.log("Normalizing extracted data:", normalizedData);
  
  // Ensure we have a structured_data object
  if (!normalizedData.structured_data) {
    normalizedData.structured_data = {};
  }
  
  // Ensure all required sections exist
  const requiredSections = ['patient', 'certification', 'examination_results', 'restrictions'];
  for (const section of requiredSections) {
    if (!normalizedData.structured_data[section]) {
      normalizedData.structured_data[section] = {};
    }
  }
  
  // Ensure examination_results has test_results
  if (!normalizedData.structured_data.examination_results.test_results) {
    normalizedData.structured_data.examination_results.test_results = {};
  }
  
  // If certification data exists at the top level but not in structured_data, move it
  if (normalizedData.certification && 
      Object.keys(normalizedData.structured_data.certification).length === 0) {
    normalizedData.structured_data.certification = {...normalizedData.certification};
  }
  
  // If restrictions data exists at the top level but not in structured_data, move it
  if (normalizedData.restrictions && 
      Object.keys(normalizedData.structured_data.restrictions).length === 0) {
    normalizedData.structured_data.restrictions = {...normalizedData.restrictions};
  }
  
  // If examination_results data exists at the top level but not in structured_data, move it
  if (normalizedData.examination_results && 
      Object.keys(normalizedData.structured_data.examination_results).length === 0) {
    normalizedData.structured_data.examination_results = {...normalizedData.examination_results};
  }
  
  // Move test_results if they exist at the wrong level
  if (normalizedData.examination_results && normalizedData.examination_results.test_results &&
      !normalizedData.structured_data.examination_results.test_results) {
    normalizedData.structured_data.examination_results.test_results = {...normalizedData.examination_results.test_results};
  }
  
  // Special handling for raw_response data
  if (normalizedData.raw_response && normalizedData.raw_response.data) {
    const markdown = normalizedData.raw_response.data.markdown;
    
    // Extract certificate information from markdown if present and not already in structured data
    if (markdown) {
      console.log("Processing markdown data for certification fields");
      
      // Try to extract certificate data if not already present
      if (Object.keys(normalizedData.structured_data.certification).length === 0) {
        // Extract certificate fitness status
        const fitnessMatch = markdown.match(/\*\*Fitness for Duty\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (fitnessMatch && fitnessMatch[1]) {
          normalizedData.structured_data.certification.fitness_status = fitnessMatch[1].trim();
        }
        
        // Extract certification date
        const dateMatch = markdown.match(/\*\*Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (dateMatch && dateMatch[1]) {
          normalizedData.structured_data.certification.date = dateMatch[1].trim();
        }
        
        // Extract certifying doctor
        const doctorMatch = markdown.match(/\*\*Doctor.*?\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (doctorMatch && doctorMatch[1]) {
          normalizedData.structured_data.certification.doctor = doctorMatch[1].trim();
        }
        
        // Extract specific fitness status
        const fitPattern = /\*\*(Fit|SUITABLE FOR WORK)\*\*/i;
        const fitWithRestrictionsPattern = /\*\*(Fit with restrictions|Fit with Limitation|Work with Restriction)\*\*/i;
        const temporarilyUnfitPattern = /\*\*(Temporarily unfit|Temporarily Unsuitable|Unfit Temporarily)\*\*/i;
        const unfitPattern = /\*\*(Unfit|Unsuitable for Work|Not Fit)\*\*/i;
        
        normalizedData.structured_data.certification.fit = fitPattern.test(markdown);
        normalizedData.structured_data.certification.fit_with_restrictions = fitWithRestrictionsPattern.test(markdown);
        normalizedData.structured_data.certification.temporarily_unfit = temporarilyUnfitPattern.test(markdown);
        normalizedData.structured_data.certification.unfit = unfitPattern.test(markdown);
        
        // Look for checkboxes
        if (markdown.match(/\[x\]\s*Fit\b/i) || markdown.match(/\[X\]\s*Fit\b/i)) {
          normalizedData.structured_data.certification.fit = true;
        }
        if (markdown.match(/\[x\]\s*Fit with restriction/i) || markdown.match(/\[X\]\s*Fit with restriction/i)) {
          normalizedData.structured_data.certification.fit_with_restrictions = true;
        }
        if (markdown.match(/\[x\]\s*Temporarily unfit/i) || markdown.match(/\[X\]\s*Temporarily unfit/i)) {
          normalizedData.structured_data.certification.temporarily_unfit = true;
        }
        if (markdown.match(/\[x\]\s*Unfit\b/i) || markdown.match(/\[X\]\s*Unfit\b/i)) {
          normalizedData.structured_data.certification.unfit = true;
        }
      }
      
      // Extract restrictions if not already present
      if (!normalizedData.structured_data.restrictions.items || 
          normalizedData.structured_data.restrictions.items.length === 0) {
        const restrictionsRegex = /\*\*Restrictions\*\*:[\s\S]*?(?=\n\n|\r\n\r\n|$)/i;
        const restrictionsMatch = markdown.match(restrictionsRegex);
        
        if (restrictionsMatch && restrictionsMatch[0]) {
          const restrictions = restrictionsMatch[0].replace(/\*\*Restrictions\*\*:\s*/i, '').trim();
          if (restrictions && restrictions !== 'None' && restrictions !== 'N/A') {
            normalizedData.structured_data.restrictions.items = [restrictions];
          }
        }
      }
      
      // Extract test results if not already present
      if (Object.keys(normalizedData.structured_data.examination_results.test_results).length === 0) {
        // Look for common test patterns in the markdown
        const testPatterns = [
          { name: 'hearing_test', regex: /\*\*Hearing Test\*\*:\s*(.*?)(?=\n|\r|$)/i },
          { name: 'vision_test', regex: /\*\*Vision Test\*\*:\s*(.*?)(?=\n|\r|$)/i },
          { name: 'blood_pressure', regex: /\*\*Blood Pressure\*\*:\s*(.*?)(?=\n|\r|$)/i }
        ];
        
        testPatterns.forEach(pattern => {
          const match = markdown.match(pattern.regex);
          if (match && match[1]) {
            normalizedData.structured_data.examination_results.test_results[pattern.name] = match[1].trim();
          }
        });
      }
    }
  }
  
  console.log("Normalized data structure:", 
    JSON.stringify({
      certification: normalizedData.structured_data.certification,
      restrictions: normalizedData.structured_data.restrictions,
      examination_results: normalizedData.structured_data.examination_results
    }, null, 2)
  );
  
  return normalizedData;
}
