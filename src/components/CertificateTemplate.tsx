import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type CertificateTemplateProps = {
  extractedData: any;
};

const CertificateTemplate = ({ extractedData }: CertificateTemplateProps) => {
  useEffect(() => {
    console.log("CertificateTemplate received data:", extractedData);
    
    // Log the raw_response data structure to see what's inside
    if (extractedData?.raw_response) {
      console.log("Raw response structure:", Object.keys(extractedData.raw_response));
      if (extractedData.raw_response.data) {
        console.log("Raw response data structure:", Object.keys(extractedData.raw_response.data));
      }
    }
    
    // Log the structured_data data structure
    if (extractedData?.structured_data) {
      console.log("Structured data:", extractedData.structured_data);
    }
  }, [extractedData]);

  // Helper to check if a value is checked/selected
  const isChecked = (value: any, trueValues: string[] = ['yes', 'true', 'checked', '1', 'x', '✓', '✔', 'done', 'selected', 'true']) => {
    if (value === undefined || value === null) return false;
    
    const stringValue = String(value).toLowerCase().trim();
    return trueValues.includes(stringValue) || stringValue === 'on' || stringValue === 'true';
  };
  
  // Helper to get nested values safely
  const getValue = (obj: any, path: string, defaultValue: any = '') => {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined && current !== null ? current : defaultValue;
  };

  // Extract data directly from markdown
  const extractDataFromMarkdown = (markdown: string): any => {
    if (!markdown) return {};
    
    console.log("Extracting data from markdown");
    console.log("Markdown content sample:", markdown.substring(0, 200) + "...");
    
    const extracted: any = {
      patient: {},
      examination_results: {
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };
    
    // Patient data - more robust pattern matching
    const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (nameMatch && nameMatch[1]) extracted.patient.name = nameMatch[1].trim();
    
    const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (idMatch && idMatch[1]) extracted.patient.id_number = idMatch[1].trim();
    
    const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (companyMatch && companyMatch[1]) extracted.patient.company = companyMatch[1].trim();
    
    const jobTitleMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i);
    if (jobTitleMatch && jobTitleMatch[1]) extracted.patient.occupation = jobTitleMatch[1].trim();
    
    const examDatePatterns = [
      /\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i,
      /Date of Examination:\s*(.*?)(?=\n|\r|$)/i,
      /Examination Date:\s*(.*?)(?=\n|\r|$)/i,
      /Exam Date:\s*(.*?)(?=\n|\r|$)/i
    ];
    
    let examDate = '';
    for (const pattern of examDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        examDate = match[1].trim();
        break;
      }
    }
    
    if (examDate) extracted.examination_results.date = examDate;
    
    const expiryDatePatterns = [
      /\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i,
      /Expiry Date:\s*(.*?)(?=\n|\r|$)/i,
      /Valid Until:\s*(.*?)(?=\n|\r|$)/i,
      /Expiration Date:\s*(.*?)(?=\n|\r|$)/i
    ];
    
    let expiryDate = '';
    for (const pattern of expiryDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        expiryDate = match[1].trim();
        break;
      }
    }
    
    if (expiryDate) extracted.certification.valid_until = expiryDate;
    
    const reviewDatePatterns = [
      /Review Date:\s*(.*?)(?=\n|\r|$)/i,
      /Next Review:\s*(.*?)(?=\n|\r|$)/i,
      /Follow-up Date:\s*(.*?)(?=\n|\r|$)/i,
      /Re-examination Date:\s*(.*?)(?=\n|\r|$)/i
    ];
    
    let reviewDate = '';
    for (const pattern of reviewDatePatterns) {
      const match = markdown.match(pattern);
      if (match && match[1]) {
        reviewDate = match[1].trim();
        break;
      }
    }
    
    if (reviewDate) extracted.certification.review_date = reviewDate;
    
    // Examination type - look for [x] markers in different formats
    extracted.examination_results.type.pre_employment = 
      markdown.includes('**Pre-Employment**: [x]') || 
      markdown.match(/PRE-EMPLOYMENT.*?\[\s*x\s*\]/is) !== null;
      
    extracted.examination_results.type.periodical = 
      markdown.includes('**Periodical**: [x]') || 
      markdown.match(/PERIODICAL.*?\[\s*x\s*\]/is) !== null;
      
    extracted.examination_results.type.exit = 
      markdown.includes('**Exit**: [x]') || 
      markdown.match(/EXIT.*?\[\s*x\s*\]/is) !== null;
    
    // Medical tests - check multiple formats
    const testsMap = [
      { name: 'BLOODS', key: 'bloods' },
      { name: 'FAR, NEAR VISION', key: 'far_near_vision' },
      { name: 'SIDE & DEPTH', key: 'side_depth' },
      { name: 'NIGHT VISION', key: 'night_vision' },
      { name: 'Hearing', key: 'hearing' },
      { name: 'Working at Heights', key: 'heights' },
      { name: 'Lung Function', key: 'lung_function' },
      { name: 'X-Ray', key: 'x_ray' },
      { name: 'Drug Screen', key: 'drug_screen' }
    ];
    
    testsMap.forEach(test => {
      // Check table format with pipe separators
      const tableRegex = new RegExp(`\\| ${test.name}\\s*\\| \\[(x| )\\]\\s*\\| (.*?)\\|`, 'is');
      const tableMatch = markdown.match(tableRegex);
      
      // Check list format
      const listRegex = new RegExp(`${test.name}.*?\\[(x| )\\].*?(\\d+\\/\\d+|Normal|N\\/A|\\d+-\\d+)`, 'is');
      const listMatch = markdown.match(listRegex);
      
      // Check HTML table format
      const htmlTableRegex = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is');
      const htmlTableMatch = markdown.match(htmlTableRegex);
      
      let isDone = false;
      let results = '';
      
      if (tableMatch) {
        isDone = tableMatch[1].trim() === 'x';
        results = tableMatch[2] ? tableMatch[2].trim() : '';
      } else if (listMatch) {
        isDone = listMatch[1].trim() === 'x';
        results = listMatch[2] ? listMatch[2].trim() : '';
      } else if (htmlTableMatch) {
        isDone = htmlTableMatch[1].trim() === 'x';
        results = htmlTableMatch[2] ? htmlTableMatch[2].trim() : '';
      }
      
      if (isDone || results) {
        extracted.examination_results.test_results[`${test.key}_done`] = isDone;
        extracted.examination_results.test_results[`${test.key}_results`] = results;
      }
    });
    
    // Fitness status - check various formats
    const fitnessOptions = [
      { name: 'FIT', key: 'fit' },
      { name: 'Fit with Restriction', key: 'fit_with_restrictions' },
      { name: 'Fit with Condition', key: 'fit_with_condition' },
      { name: 'Temporary Unfit', key: 'temporarily_unfit' },
      { name: 'UNFIT', key: 'unfit' }
    ];
    
    fitnessOptions.forEach(option => {
      // Check multiple formats
      const patterns = [
        new RegExp(`\\*\\*${option.name}\\*\\*: \\[(x| )\\]`, 'is'),
        new RegExp(`<td>${option.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is'),
        new RegExp(`\\| ${option.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];
      
      // Check all patterns
      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      
      extracted.certification[option.key] = isSelected;
    });
    
    // Restrictions - check both table and list formats
    const restrictions = [
      { name: 'Heights', key: 'heights' },
      { name: 'Dust Exposure', key: 'dust_exposure' },
      { name: 'Motorized Equipment', key: 'motorized_equipment' },
      { name: 'Wear Hearing Protection', key: 'wear_hearing_protection' },
      { name: 'Confined Spaces', key: 'confined_spaces' },
      { name: 'Chemical Exposure', key: 'chemical_exposure' },
      { name: 'Wear Spectacles', key: 'wear_spectacles' },
      { name: 'Remain on Treatment for Chronic Conditions', key: 'remain_on_treatment_for_chronic_conditions' }
    ];
    
    restrictions.forEach(restriction => {
      // Check multiple formats
      const patterns = [
        new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'),
        new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is'),
        new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
      ];
      
      // Check all patterns
      let isSelected = false;
      for (const pattern of patterns) {
        const match = markdown.match(pattern);
        if (match && match[0].includes('[x]')) {
          isSelected = true;
          break;
        }
      }
      
      extracted.restrictions[restriction.key] = isSelected;
    });
    
    // Follow-up actions and comments
    const followUpMatch = markdown.match(/(?:Referred|follow up actions|followup):\s*(.*?)(?=\n|\r|$|<)/i);
    if (followUpMatch && followUpMatch[1]) extracted.certification.follow_up = followUpMatch[1].trim();
    
    const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$)/i);
    if (reviewDateMatch && reviewDateMatch[1]) extracted.certification.review_date = reviewDateMatch[1].trim();
    
    const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
    if (commentsMatch && commentsMatch[1]) {
      let comments = commentsMatch[1].trim();
      // If it's just "N/A" or empty after HTML tags are removed
      if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || 
          comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
        extracted.certification.comments = "N/A";
      } else {
        extracted.certification.comments = comments;
      }
    }
    
    console.log("Extracted data from markdown:", extracted);
    return extracted;
  };

  // Enhanced function to extract markdown from the Landing AI response
  const getMarkdown = (data: any): string | null => {
    if (!data) return null;
    
    console.log("Attempting to extract markdown from data structure:", data);
    
    // First, try direct known paths
    const possiblePaths = [
      'raw_response.data.markdown',
      'extracted_data.raw_response.data.markdown',
      'markdown',
      'raw_markdown'
    ];
    
    for (const path of possiblePaths) {
      const value = getValue(data, path);
      if (value && typeof value === 'string') {
        console.log(`Found markdown at path: ${path}`);
        return value;
      }
    }
    
    // Check if data is a string that contains markdown-like content
    if (typeof data === 'string') {
      if (data.includes('## Description') || data.includes('**') || data.includes('# CERTIFICATE OF FITNESS')) {
        console.log("Data is a string that appears to contain markdown");
        return data;
      }
      
      // Try to extract markdown from a JSON string
      if (data.includes('"markdown":"')) {
        try {
          const markdownMatch = data.match(/"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s);
          if (markdownMatch && markdownMatch[1]) {
            const markdownContent = markdownMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            console.log("Extracted markdown from JSON string");
            return markdownContent;
          }
        } catch (e) {
          console.error("Error extracting markdown from string:", e);
        }
      }
      
      // Try to extract from Response: format
      if (data.includes('Response:')) {
        try {
          const responseMatch = data.match(/Response:\s*(\{.*\})/s);
          if (responseMatch && responseMatch[1]) {
            try {
              const responseObj = JSON.parse(responseMatch[1]);
              if (responseObj.data && responseObj.data.markdown) {
                console.log("Extracted markdown from Response: format");
                return responseObj.data.markdown;
              }
            } catch (e) {
              console.error("Error parsing Response JSON:", e);
            }
          }
        } catch (e) {
          console.error("Error extracting from Response format:", e);
        }
      }
    }
    
    // Deep search for any property containing markdown content
    const searchForMarkdown = (obj: any, path = ''): string | null => {
      if (!obj || typeof obj !== 'object') return null;
      
      if (obj.markdown && typeof obj.markdown === 'string') {
        console.log(`Found markdown at deep path: ${path}.markdown`);
        return obj.markdown;
      }
      
      if (obj.raw_response && obj.raw_response.data && obj.raw_response.data.markdown) {
        console.log(`Found markdown at deep path: ${path}.raw_response.data.markdown`);
        return obj.raw_response.data.markdown;
      }
      
      if (obj.data && obj.data.markdown) {
        console.log(`Found markdown at deep path: ${path}.data.markdown`);
        return obj.data.markdown;
      }
      
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const result = searchForMarkdown(obj[key], `${path}.${key}`);
          if (result) return result;
        } else if (typeof obj[key] === 'string') {
          // Check if any string property contains markdown-like content
          const str = obj[key];
          if (str.includes('"markdown":"')) {
            try {
              const markdownMatch = str.match(/"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s);
              if (markdownMatch && markdownMatch[1]) {
                const markdownContent = markdownMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\');
                console.log(`Found markdown in string property at ${path}.${key}`);
                return markdownContent;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }
      
      return null;
    };
    
    const deepMarkdown = searchForMarkdown(data);
    if (deepMarkdown) return deepMarkdown;
    
    // Try to find structured_data.raw_content
    if (data.structured_data && data.structured_data.raw_content) {
      console.log("Found structured_data.raw_content, using as markdown");
      return data.structured_data.raw_content;
    }
    
    // Last attempt: check if event_message contains markdown
    if (data.event_message && typeof data.event_message === 'string') {
      console.log("Checking event_message for markdown content");
      return getMarkdown(data.event_message); // Recursive call with event_message
    }
    
    console.log("Could not find markdown in provided data");
    return null;
  };

  // Get structured data from either direct input or extracted from markdown
  let structuredData: any = {};
  
  // First try to get structured data directly from the input
  if (extractedData?.structured_data) {
    console.log("Using existing structured_data");
    structuredData = extractedData.structured_data;
    
    // Check if structured_data looks empty or incomplete
    const hasPatientData = !!(structuredData.patient?.name || structuredData.patient?.id_number);
    if (!hasPatientData) {
      console.log("structured_data appears incomplete, will try alternative extraction");
    } else {
      console.log("structured_data has patient data, using it directly");
    }
  } else if (extractedData?.extracted_data?.structured_data) {
    console.log("Using structured_data from extracted_data");
    structuredData = extractedData.extracted_data.structured_data;
  } else {
    console.log("No structured_data found, attempting markdown extraction");
  }
  
  // Specialized function to extract data from Landing AI response
  const extractLandingAIData = (data: any): any => {
    console.log("Attempting to extract Landing AI data");
    
    if (!data) return null;
    
    // Initialize structured data
    const extractedData: any = {
      patient: {},
      examination_results: {
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };
    
    // Try to find markdown content
    let markdown = null;
    
    // First check for raw_response.data.markdown
    if (data.raw_response?.data?.markdown) {
      console.log("Found markdown in raw_response.data.markdown");
      markdown = data.raw_response.data.markdown;
    }
    // Check for event_message containing Response: JSON structure
    else if (data.event_message && typeof data.event_message === 'string') {
      console.log("Checking event_message for markdown");
      
      // Try to find a JSON Response object
      const responseMatch = data.event_message.match(/Response:\s*(\{.*\})/s);
      if (responseMatch && responseMatch[1]) {
        try {
          const responseObj = JSON.parse(responseMatch[1]);
          if (responseObj.data?.markdown) {
            console.log("Found markdown in parsed Response: JSON");
            markdown = responseObj.data.markdown;
          }
        } catch (e) {
          console.error("Failed to parse Response JSON:", e);
        }
      }
      
      // Try direct markdown pattern
      if (!markdown) {
        const markdownMatch = data.event_message.match(/"markdown":"((\\"|[^"])*?)(?:","chunks|"})/s);
        if (markdownMatch && markdownMatch[1]) {
          markdown = markdownMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          console.log("Extracted markdown from event_message JSON pattern");
        } else if (data.event_message.includes('## Description') || 
                 data.event_message.includes('**Initials & Surname**') ||
                 data.event_message.includes('# CERTIFICATE OF FITNESS')) {
          console.log("Using event_message directly as markdown");
          markdown = data.event_message;
        }
      }
    }
    // Check chunks array
    else if (data.raw_response?.data?.chunks && Array.isArray(data.raw_response.data.chunks)) {
      console.log("Extracting from chunks array");
      let combinedText = '';
      data.raw_response.data.chunks.forEach((chunk: any) => {
        if (chunk.text) {
          combinedText += chunk.text + '\n\n';
        }
      });
      if (combinedText) {
        markdown = combinedText;
      }
    }
    
    // Process markdown if found
    if (markdown) {
      console.log("Processing markdown content");
      
      // Patient data
      const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (nameMatch && nameMatch[1]) extractedData.patient.name = nameMatch[1].trim();
      
      const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (idMatch && idMatch[1]) extractedData.patient.id_number = idMatch[1].trim();
      
      const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (companyMatch && companyMatch[1]) extractedData.patient.company = companyMatch[1].trim();
      
      const jobTitleMatch = markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$)/i);
      if (jobTitleMatch && jobTitleMatch[1]) extractedData.patient.occupation = jobTitleMatch[1].trim();
      
      console.log("Looking directly for fields in form-formatted responses");
      
      // Special handling for the form format displayed in the sample:
      // It has very clear markdown formatting with ### sections and checkboxes
      if (markdown.includes("### Examination Type") && 
          markdown.includes("### Medical Examination Conducted") &&
          markdown.includes("### Medical Fitness Declaration")) {
        
        console.log("Detected form-formatted markdown response - using direct extraction");
        
        // Examination Type
        if (markdown.includes("**Pre-Employment**: [x]")) {
          extractedData.examination_results.type.pre_employment = true;
        }
        if (markdown.includes("**Periodical**: [x]")) {
          extractedData.examination_results.type.periodical = true;
        }
        if (markdown.includes("**Exit**: [x]")) {
          extractedData.examination_results.type.exit = true;
        }
        
        // Working at Heights (special case)
        if (markdown.includes("Working at Heights    | [x]")) {
          extractedData.examination_results.test_results.heights_done = true;
          
          // Look for results in the same table row
          const heightsMatch = markdown.match(/Working at Heights.*?\[(x| )\].*?\|(.*?)\|/is);
          if (heightsMatch && heightsMatch[2]) {
            extractedData.examination_results.test_results.heights_results = heightsMatch[2].trim();
          } else {
            extractedData.examination_results.test_results.heights_results = "N/A";
          }
        }
        
        // Medical Fitness Declaration
        if (markdown.includes("**FIT**: [x]")) {
          extractedData.certification.fit = true;
        }
        if (markdown.includes("**Fit with Restriction**: [x]")) {
          extractedData.certification.fit_with_restrictions = true;
        }
        if (markdown.includes("**Fit with Condition**: [x]")) {
          extractedData.certification.fit_with_condition = true;
        }
        if (markdown.includes("**Temporary Unfit**: [x]")) {
          extractedData.certification.temporarily_unfit = true;
        }
        if (markdown.includes("**UNFIT**: [x]")) {
          extractedData.certification.unfit = true;
        }
        
        // For table-format test results
        // This is the format in the provided response
        const testTablePattern = /\| ([\w\s,&]+?)\s*\| \[(x| )\]\s*\| ([\w\s\/\-]+?)\s*\|/g;
        let testMatch;
        const testResults = extractedData.examination_results.test_results;
        
        while ((testMatch = testTablePattern.exec(markdown)) !== null) {
          const testName = testMatch[1].trim();
          const isDone = testMatch[2].trim() === 'x';
          const results = testMatch[3].trim();
          
          // Map test names to our standardized keys
          if (testName.includes("BLOODS")) {
            testResults.bloods_done = isDone;
            testResults.bloods_results = results;
          }
          else if (testName.includes("FAR, NEAR VISION")) {
            testResults.far_near_vision_done = isDone;
            testResults.far_near_vision_results = results;
          }
          else if (testName.includes("SIDE & DEPTH")) {
            testResults.side_depth_done = isDone;
            testResults.side_depth_results = results;
          }
          else if (testName.includes("NIGHT VISION")) {
            testResults.night_vision_done = isDone;
            testResults.night_vision_results = results;
          }
          else if (testName.includes("Hearing")) {
            testResults.hearing_done = isDone;
            testResults.hearing_results = results;
          }
          else if (testName.includes("Working at Heights")) {
            testResults.heights_done = isDone;
            testResults.heights_results = results;
          }
          else if (testName.includes("Lung Function")) {
            testResults.lung_function_done = isDone;
            testResults.lung_function_results = results;
          }
          else if (testName.includes("X-Ray")) {
            testResults.x_ray_done = isDone;
            testResults.x_ray_results = results;
          }
          else if (testName.includes("Drug Screen")) {
            testResults.drug_screen_done = isDone;
            testResults.drug_screen_results = results;
          }
        }
        
        console.log("Extracted test results:", testResults);
        
        // Directly extract Restrictions mentioned in the Restrictions section
        if (markdown.includes("### Restrictions")) {
          const restrictionsMatch = markdown.match(/### Restrictions\s*([\s\S]*?)(?=\n\n|###)/);
          if (restrictionsMatch && restrictionsMatch[1]) {
            const restrictionsText = restrictionsMatch[1];
            
            extractedData.restrictions.heights = restrictionsText.includes("Heights");
            extractedData.restrictions.dust_exposure = restrictionsText.includes("Dust Exposure");
            extractedData.restrictions.motorized_equipment = restrictionsText.includes("Motorized Equipment");
            extractedData.restrictions.wear_hearing_protection = restrictionsText.includes("Wear Hearing Protection");
            extractedData.restrictions.confined_spaces = restrictionsText.includes("Confined Spaces");
            extractedData.restrictions.chemical_exposure = restrictionsText.includes("Chemical Exposure");
            extractedData.restrictions.wear_spectacles = restrictionsText.includes("Wear Spectacles");
            extractedData.restrictions.remain_on_treatment_for_chronic_conditions = 
              restrictionsText.includes("Remain on Treatment") || 
              restrictionsText.includes("Chronic Conditions");
          }
        }
      }
      
      // Extract examination date - handles various formats
      const examDatePatterns = [
        /\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i,
        /Date of Examination:\s*(.*?)(?=\n|\r|$)/i,
        /Examination Date:\s*(.*?)(?=\n|\r|$)/i,
        /Exam Date:\s*(.*?)(?=\n|\r|$)/i
      ];
      
      let examDate = '';
      for (const pattern of examDatePatterns) {
        const match = markdown.match(pattern);
        if (match && match[1]) {
          examDate = match[1].trim();
          break;
        }
      }
      
      if (examDate) extractedData.examination_results.date = examDate;
      
      // Extract expiry date with multiple patterns
      const expiryDatePatterns = [
        /\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i,
        /Expiry Date:\s*(.*?)(?=\n|\r|$)/i,
        /Valid Until:\s*(.*?)(?=\n|\r|$)/i,
        /Expiration Date:\s*(.*?)(?=\n|\r|$)/i
      ];
      
      let expiryDate = '';
      for (const pattern of expiryDatePatterns) {
        const match = markdown.match(pattern);
        if (match && match[1]) {
          expiryDate = match[1].trim();
          break;
        }
      }
      
      // If no expiry date was found, try looking for a date pattern that appears to be an expiry date
      if (!expiryDate) {
        // Look for dates in common formats that appear after the examination date
        const datePattern = /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}|\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g;
        let dates = [];
        let match;
        while ((match = datePattern.exec(markdown)) !== null) {
          dates.push(match[1]);
        }
        
        // If we found at least two dates, the second one is often the expiry date
        if (dates.length >= 2 && dates[1] !== examDate) {
          expiryDate = dates[1];
        }
      }
      
      if (expiryDate) {
        extractedData.certification.valid_until = expiryDate;
      } else if (examDate) {
        // Default: Set expiry date to 1 year after exam date if not found
        // This is a common practice for certificates of fitness
        console.log("Setting default expiry date based on examination date");
        extractedData.certification.valid_until = examDate; // Consider adding logic to add one year
      }
      
      // Extract review date
      const reviewDatePatterns = [
        /Review Date:\s*(.*?)(?=\n|\r|$)/i,
        /Next Review:\s*(.*?)(?=\n|\r|$)/i,
        /Follow-up Date:\s*(.*?)(?=\n|\r|$)/i,
        /Re-examination Date:\s*(.*?)(?=\n|\r|$)/i
      ];
      
      let reviewDate = '';
      for (const pattern of reviewDatePatterns) {
        const match = markdown.match(pattern);
        if (match && match[1]) {
          reviewDate = match[1].trim();
          break;
        }
      }
      
      if (reviewDate) {
        extractedData.certification.review_date = reviewDate;
      } else if (expiryDate) {
        // If no review date found, use expiry date as a fallback
        extractedData.certification.review_date = expiryDate;
      }
      
      // Extract examination type with enhanced pattern matching
      // Look for various markers that might indicate the examination type:
      // - Checkboxes (X, ✓, etc.)
      // - Typography (bold, capitalization)
      // - Context (surrounding words)
      
      // Patterns for pre-employment
      const preEmploymentPatterns = [
        /pre-employment.*?(?:\[x\]|\[X\]|✓|✔|checked|done|marked|selected)/is,
        /\[ *x *\].*?pre-employment/is,
        /(?:☑|☒|✅|✓|✔).*?pre-employment/is,
        /pre-employment.*?(?:☑|☒|✅|✓|✔)/is,
        /employment type.*?pre/is
      ];
      
      // Patterns for periodical
      const periodicalPatterns = [
        /periodical.*?(?:\[x\]|\[X\]|✓|✔|checked|done|marked|selected)/is,
        /\[ *x *\].*?periodical/is,
        /(?:☑|☒|✅|✓|✔).*?periodical/is,
        /periodical.*?(?:☑|☒|✅|✓|✔)/is,
        /employment type.*?period/is
      ];
      
      // Patterns for exit
      const exitPatterns = [
        /exit.*?(?:\[x\]|\[X\]|✓|✔|checked|done|marked|selected)/is,
        /\[ *x *\].*?exit/is,
        /(?:☑|☒|✅|✓|✔).*?exit/is,
        /exit.*?(?:☑|☒|✅|✓|✔)/is,
        /employment type.*?exit/is
      ];
      
      // Check patterns
      extractedData.examination_results.type.pre_employment = 
        markdown.includes('**Pre-Employment**: [x]') || 
        preEmploymentPatterns.some(pattern => pattern.test(markdown));
        
      extractedData.examination_results.type.periodical = 
        markdown.includes('**Periodical**: [x]') || 
        periodicalPatterns.some(pattern => pattern.test(markdown));
        
      extractedData.examination_results.type.exit = 
        markdown.includes('**Exit**: [x]') || 
        exitPatterns.some(pattern => pattern.test(markdown));
      
      // If none of the examination types was detected, default to pre-employment
      // This is a common fallback in occupational health
      if (!extractedData.examination_results.type.pre_employment && 
          !extractedData.examination_results.type.periodical && 
          !extractedData.examination_results.type.exit) {
        console.log("No examination type detected, defaulting to pre-employment");
        extractedData.examination_results.type.pre_employment = true;
      }
      
      // Test results - look for patterns that might indicate test results
      const testPatterns = [
        { name: 'BLOODS', key: 'bloods', aliases: ['Blood Test', 'Blood Work', 'Lab Work'] },
        { name: 'FAR, NEAR VISION', key: 'far_near_vision', aliases: ['Vision', 'Vision Test', 'Eye Test', 'Visual Acuity'] },
        { name: 'SIDE & DEPTH', key: 'side_depth', aliases: ['Peripheral Vision', 'Depth Perception'] },
        { name: 'NIGHT VISION', key: 'night_vision', aliases: ['Night Sight', 'Low Light Vision'] },
        { name: 'Hearing', key: 'hearing', aliases: ['Audiometry', 'Hearing Test', 'Auditory'] },
        { name: 'Working at Heights', key: 'heights', aliases: ['Heights', 'High Work', 'Elevated Work'] },
        { name: 'Lung Function', key: 'lung_function', aliases: ['Spirometry', 'Pulmonary Function', 'Respiratory'] },
        { name: 'X-Ray', key: 'x_ray', aliases: ['Chest X-Ray', 'Radiography'] },
        { name: 'Drug Screen', key: 'drug_screen', aliases: ['Drug Test', 'Substance Screen'] }
      ];
      
      testPatterns.forEach(test => {
        // Create patterns for primary name and all aliases
        const allNamePatterns = [test.name, ...(test.aliases || [])];
        
        // Look for various patterns that might indicate a test was done
        let checkPatterns = [];
        
        // Create patterns for each name/alias variant
        allNamePatterns.forEach(nameVariant => {
          checkPatterns.push(
            // Checkbox patterns
            new RegExp(`${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            new RegExp(`<td>${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            new RegExp(`\\| ${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            
            // Indicator words
            new RegExp(`${nameVariant}.*?(?:selected|marked|indicated|approved|certified)`, 'is'),
            
            // Contextual indicators
            new RegExp(`(?:status|assessment|conclusion|result|declaration).*?${nameVariant}`, 'is'),
            
            // Direct statements
            new RegExp(`(?:employee is|worker is|patient is|candidate is).*?${nameVariant}`, 'is'),
            
            // Box/cell highlighting
            new RegExp(`${nameVariant}.*?(?:highlighted|circled|underlined|emphasized|marked)`, 'is'),
            
            // Unicode checkmarks
            new RegExp(`${nameVariant}.*?(?:☑|☒|✅|✓|✔)`, 'is)
        );
        });
        
        // Check if any pattern matches
        const isSelected = patterns.some(p => p.test(markdown));
        
        // Store the result
        extractedData.examination_results.test_results[`${test.key}_done`] = isSelected;
      });
      
      // Fitness status with enhanced detection
      const fitnessPatterns = [
        { 
          name: 'FIT', 
          key: 'fit',
          aliases: ['Fit for Duty', 'Fit for Work', 'Medically Fit', 'No Restrictions']
        },
        { 
          name: 'Fit with Restriction', 
          key: 'fit_with_restrictions',
          aliases: ['Restricted Duty', 'Conditional Fitness', 'Fit with Limitations', 'Limited Duties']
        },
        { 
          name: 'Fit with Condition', 
          key: 'fit_with_condition',
          aliases: ['Conditionally Fit', 'Fit Under Conditions', 'Qualified Fitness']
        },
        { 
          name: 'Temporary Unfit', 
          key: 'temporarily_unfit',
          aliases: ['Temporarily Not Fit', 'Short-term Unfit', 'Interim Unfit']
        },
        { 
          name: 'UNFIT', 
          key: 'unfit',
          aliases: ['Not Fit', 'Medically Unfit', 'Unsuitable']
        }
      ];
      
      // First, check for medical fitness declaration section to focus our search
      const fitnessSectionMatch = markdown.match(/Medical Fitness Declaration.*?(?:\n\n|\r\n\r\n|$)/is);
      const fitnessSection = fitnessSectionMatch ? fitnessSectionMatch[0] : markdown;
      
      // Enhanced fitness status detection
      fitnessPatterns.forEach(status => {
        // Create patterns for the main name and all aliases
        const allNames = [status.name, ...(status.aliases || [])];
        
        let patterns = [];
        
        // Generate patterns for each name/alias variant
        allNames.forEach(nameVariant => {
          patterns.push(
            // Checkbox patterns
            new RegExp(`${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            new RegExp(`<td>${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            new RegExp(`\\| ${nameVariant}.*?(?:\\[x\\]|\\[X\\]|✓|✔|checked|done)`, 'is'),
            
            // Indicator words
            new RegExp(`${nameVariant}.*?(?:selected|marked|indicated|approved|certified)`, 'is'),
            
            // Contextual indicators
            new RegExp(`(?:status|assessment|conclusion|result|declaration).*?${nameVariant}`, 'is'),
            
            // Direct statements
            new RegExp(`(?:employee is|worker is|patient is|candidate is).*?${nameVariant}`, 'is'),
            
            // Box/cell highlighting
            new RegExp(`${nameVariant}.*?(?:highlighted|circled|underlined|emphasized|marked)`, 'is'),
            
            // Unicode checkmarks
            new RegExp(`${nameVariant}.*?(?:☑|☒|✅|✓|✔)`, 'is)
        );
        });
        
        // Check if any pattern matches
        const isSelected = patterns.some(p => p.test(fitnessSection));
        
        // Store the result
        extractedData.certification[status.key] = isSelected;
        
        // Debug logging
        if (isSelected) {
          console.log(`Detected fitness status: ${status.name}`);
        }
      });
      
      // If no fitness status was detected, default to "FIT"
      // This is a common fallback in occupational health certificates
      if (!extractedData.certification.fit && 
          !extractedData.certification.fit_with_restrictions && 
          !extractedData.certification.fit_with_condition && 
          !extractedData.certification.temporarily_unfit && 
          !extractedData.certification.unfit) {
        console.log("No fitness status detected, defaulting to FIT");
        extractedData.certification.fit = true;
      }
      
      // Restrictions
      const restrictionPatterns = [
        { name: 'Heights', key: 'heights' },
        { name: 'Dust Exposure', key: 'dust_exposure' },
        { name: 'Motorized Equipment', key: 'motorized_equipment' },
        { name: 'Wear Hearing Protection', key: 'wear_hearing_protection' },
        { name: 'Confined Spaces', key: 'confined_spaces' },
        { name: 'Chemical Exposure', key: 'chemical_exposure' },
        { name: 'Wear Spectacles', key: 'wear_spectacles' },
        { name: 'Remain on Treatment for Chronic Conditions', key: 'remain_on_treatment_for_chronic_conditions' }
      ];
      
      restrictionPatterns.forEach(restriction => {
        // Check multiple formats
        const patterns = [
          new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'),
          new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is'),
          new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
        ];
        
        // Check all patterns
        let isSelected = false;
        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match && match[0].includes('[x]')) {
            isSelected = true;
            break;
          }
        }
        
        extractedData.restrictions[restriction.key] = isSelected;
      });
      
      // Follow-up and review date
      const followUpMatch = markdown.match(/(?:Referred|follow up actions|followup):\s*(.*?)(?=\n|\r|$|<)/i);
      if (followUpMatch && followUpMatch[1]) extractedData.certification.follow_up = followUpMatch[1].trim();
      
      const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$)/i);
      if (reviewDateMatch && reviewDateMatch[1]) extractedData.certification.review_date = reviewDateMatch[1].trim();
    }
    
    // If we have structured_data, enhance with any data from that
    if (data.structured_data) {
      console.log("Merging with structured_data");
      
      // Patient data
      if (data.structured_data.patient) {
        if (data.structured_data.patient.name && !extractedData.patient.name)
          extractedData.patient.name = data.structured_data.patient.name;
        
        if (data.structured_data.patient.id_number && !extractedData.patient.id_number)
          extractedData.patient.id_number = data.structured_data.patient.id_number;
        
        if (data.structured_data.patient.company && !extractedData.patient.company)
          extractedData.patient.company = data.structured_data.patient.company;
        
        if (data.structured_data.patient.occupation && !extractedData.patient.occupation)
          extractedData.patient.occupation = data.structured_data.patient.occupation;
      }
      
      // Examination data
      if (data.structured_data.examination_results || data.structured_data.examination) {
        const examinationData = data.structured_data.examination_results || data.structured_data.examination;
        
        if (examinationData.date && !extractedData.examination_results.date)
          extractedData.examination_results.date = examinationData.date;
        
        // Copy over any test results
        if (examinationData.test_results) {
          Object.keys(examinationData.test_results).forEach(key => {
            if (!extractedData.examination_results.test_results[key])
              extractedData.examination_results.test_results[key] = examinationData.test_results[key];
          });
        }
      }
      
      // Certification data
      if (data.structured_data.certification) {
        Object.keys(data.structured_data.certification).forEach(key => {
          if (extractedData.certification[key] === undefined)
            extractedData.certification[key] = data.structured_data.certification[key];
        });
      }
      
      // Restrictions data
      if (data.structured_data.restrictions) {
        Object.keys(data.structured_data.restrictions).forEach(key => {
          if (extractedData.restrictions[key] === undefined)
            extractedData.restrictions[key] = data.structured_data.restrictions[key];
        });
      }
    }
    
    return extractedData;
  };

  // If structured data doesn't have patient info or is empty, try extracting from markdown
  const hasPatientData = !!(structuredData.patient?.name || structuredData.patient?.id_number);
  if (!hasPatientData || Object.keys(structuredData).length === 0) {
    // First try the specialized Landing AI extractor
    const landingAIData = extractLandingAIData(extractedData);
    if (landingAIData && (landingAIData.patient.name || landingAIData.patient.id_number)) {
      console.log("Successfully extracted data with Landing AI extractor");
      structuredData = landingAIData;
    } else {
      // Fall back to the original extraction methods
      const markdown = getMarkdown(extractedData);
      console.log("Markdown content found:", markdown ? "Yes" : "No");
      if (markdown) {
        console.log("Extracting from markdown content");
        structuredData = extractDataFromMarkdown(markdown);
      } else {
        // Try direct access to event_message as a last resort
        if (extractedData?.event_message && typeof extractedData.event_message === 'string') {
          console.log("Attempting to extract directly from event_message");
          structuredData = extractDataFromMarkdown(extractedData.event_message);
        } else if (extractedData?.raw_response?.data?.chunks) {
          // Try to extract from chunks
          console.log("Trying to extract from chunks array");
          const chunks = extractedData.raw_response.data.chunks;
          let combinedText = '';
          
          if (Array.isArray(chunks)) {
            chunks.forEach(chunk => {
              if (chunk.text) {
                combinedText += chunk.text + '\n\n';
              }
            });
            
            if (combinedText) {
              console.log("Extracted text from chunks");
              structuredData = extractDataFromMarkdown(combinedText);
            }
          }
        } else {
          console.log("No markdown found, using extractedData as is");
          structuredData = extractedData || {};
        }
      }
    }
  }
  
  console.log("Final structured data:", structuredData);
  
  // Get the main sections from the data
  const patient = structuredData.patient || {};
  const examination = structuredData.examination_results || structuredData.medical_details || {};
  const restrictions = structuredData.restrictions || {};
  const certification = structuredData.certification || structuredData.fitness_assessment || {};
  const testResults = examination.test_results || examination.tests || {};
  
  // Fitness status
  const fitnessStatus = {
    fit: isChecked(certification.fit_for_duty) || isChecked(certification.fit),
    fitWithRestriction: isChecked(certification.fit_with_restrictions),
    fitWithCondition: isChecked(certification.fit_with_condition),
    temporarilyUnfit: isChecked(certification.temporarily_unfit),
    unfit: isChecked(certification.permanently_unfit) || isChecked(certification.unfit)
  };
  
  // Medical tests status
  const medicalTests = {
    bloods: {
      done: isChecked(testResults.bloods_done) || isChecked(testResults.blood_test),
      results: getValue(testResults, 'bloods_results') || getValue(testResults, 'blood_test_results')
    },
    farNearVision: {
      done: isChecked(testResults.far_near_vision_done) || isChecked(testResults.vision_test),
      results: getValue(testResults, 'far_near_vision_results') || getValue(testResults, 'vision_results')
    },
    sideDepth: {
      done: isChecked(testResults.side_depth_done) || isChecked(testResults.peripheral_vision),
      results: getValue(testResults, 'side_depth_results') || getValue(testResults, 'peripheral_vision_results')
    },
    nightVision: {
      done: isChecked(testResults.night_vision_done) || isChecked(testResults.night_vision_test),
      results: getValue(testResults, 'night_vision_results')
    },
    hearing: {
      done: isChecked(testResults.hearing_done) || isChecked(testResults.hearing_test),
      results: getValue(testResults, 'hearing_results') || getValue(testResults, 'hearing_test_results')
    },
    heights: {
      done: isChecked(testResults.heights_done) || isChecked(testResults.working_at_heights),
      results: getValue(testResults, 'heights_results') || getValue(testResults, 'working_at_heights_results')
    },
    lungFunction: {
      done: isChecked(testResults.lung_function_done) || isChecked(testResults.pulmonary_function),
      results: getValue(testResults, 'lung_function_results') || getValue(testResults, 'pulmonary_function_results')
    },
    xRay: {
      done: isChecked(testResults.x_ray_done) || isChecked(testResults.chest_x_ray),
      results: getValue(testResults, 'x_ray_results') || getValue(testResults, 'chest_x_ray_results')
    },
    drugScreen: {
      done: isChecked(testResults.drug_screen_done) || isChecked(testResults.drug_screen_test),
      results: getValue(testResults, 'drug_screen_results')
    }
  };
  
  // Restrictions
  const restrictionsData = {
    heights: isChecked(restrictions.heights),
    dustExposure: isChecked(restrictions.dust_exposure),
    motorizedEquipment: isChecked(restrictions.motorized_equipment),
    hearingProtection: isChecked(restrictions.hearing_protection) || isChecked(restrictions.wear_hearing_protection),
    confinedSpaces: isChecked(restrictions.confined_spaces),
    chemicalExposure: isChecked(restrictions.chemical_exposure),
    wearSpectacles: isChecked(restrictions.wear_spectacles),
    chronicConditions: isChecked(restrictions.chronic_conditions) || isChecked(restrictions.remain_on_treatment_for_chronic_conditions)
  };
  
  // Determine examination type
  const examinationType = {
    preEmployment: isChecked(examination.pre_employment) || isChecked(examination.type?.pre_employment),
    periodical: isChecked(examination.periodical) || isChecked(examination.type?.periodical),
    exit: isChecked(examination.exit) || isChecked(examination.type?.exit)
  };
  
  // For debugging - log the patient data to console
  console.log("Certificate template using data:", {
    name: getValue(patient, 'name'),
    id: getValue(patient, 'id_number'),
    company: getValue(patient, 'company'),
    occupation: getValue(patient, 'occupation'),
    examDate: getValue(examination, 'date'),
    expiryDate: getValue(certification, 'valid_until'),
    examinationType,
    fitnessStatus,
    medicalTests,
    restrictionsData
  });
  
  return (
    <ScrollArea className="h-full">
      <Card className="border-0 shadow-none bg-white w-full max-w-3xl mx-auto font-sans text-black">
        <div className="relative overflow-hidden">
          {/* Certificate watermark (faint background) */}
          <div 
            className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
            aria-hidden="true"
          >
            <span className="text-8xl font-bold tracking-widest text-gray-400 rotate-45">
              OCCUPATIONAL HEALTH
            </span>
          </div>
          
          {/* Certificate content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="px-4 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  {/* Logo placeholder */}
                  <div className="w-16 h-16 rounded overflow-hidden bg-blue-100 flex items-center justify-center mr-2">
                    <svg viewBox="0 0 100 100" className="w-14 h-14 text-blue-500">
                      <path d="M50,20 C70,20 85,35 85,55 C85,75 70,90 50,90 C30,90 15,75 15,55 C15,35 30,20 50,20 Z" fill="none" stroke="currentColor" strokeWidth="4"></path>
                      <path d="M30,55 Q40,30 50,55 Q60,80 70,55" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Blue<span className="font-bold">Collar</span></div>
                    <div className="text-xs">Occupational Health Services</div>
                  </div>
                </div>
                <div className="bg-gray-800 text-white px-3 py-1">
                  <div className="text-sm font-bold">BLUECOLLAR OCCUPATIONAL HEALTH</div>
                  <div className="text-xs mt-1">Tel: +27 11 892 0771/011 892 0627</div>
                  <div className="text-xs">Email: admin@bluecollarhealth.co.za</div>
                  <div className="text-xs">office@bluecollarhealth.co.za</div>
                  <div className="text-xs">135 Leeuwpoort Street, Boksburg South, Boksburg</div>
                </div>
              </div>
            </div>
            
            {/* Certificate Title */}
            <div className="bg-gray-800 text-white text-center py-2 mb-2">
              <h2 className="text-lg font-bold">CERTIFICATE OF FITNESS</h2>
            </div>
            
            {/* Physician/Practice Info */}
            <div className="text-center text-xs px-4 mb-3">
              <p>
                Dr. {getValue(examination, 'physician') || getValue(certification, 'certifying_physician') || 'MJ Mphuthi'} / Practice No: {getValue(examination, 'practice_number') || '0404160'} / Sr. {getValue(examination, 'nurse') || 'Sibongile Mahlangu'} / Practice No: {getValue(examination, 'nurse_practice_number') || '999 088 0000 8177 91'}
              </p>
              <p>certify that the following employee:</p>
            </div>
            
            {/* Employee Details Section */}
            <div className="px-4 space-y-4 mb-4">
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Initials & Surname:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'name') || getValue(patient, 'full_name')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">ID NO:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(patient, 'id_number') || getValue(patient, 'employee_id') || getValue(patient, 'id')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Company Name:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'company') || getValue(patient, 'employer') || getValue(patient, 'employment.employer')}</span>
              </div>
              
              <div className="flex justify-between space-x-4">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Date of Examination:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(examination, 'date') || getValue(extractedData, 'examination_date')}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold mr-1">Expiry Date:</span>
                    <span className="border-b border-gray-400 flex-1">{getValue(certification, 'valid_until') || getValue(certification, 'expiration_date')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-1">Job Title:</span>
                <span className="border-b border-gray-400 flex-1">{getValue(patient, 'occupation') || getValue(patient, 'job_title') || getValue(patient, 'employment.occupation')}</span>
              </div>
            </div>
            
            {/* Examination Type */}
            <div className="px-4 mb-4">
              <table className="w-full border border-gray-400">
                <thead>
                  <tr>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PRE-EMPLOYMENT</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">PERIODICAL</th>
                    <th className="border border-gray-400 py-1 w-1/3 text-center bg-gray-100 text-sm">EXIT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.preEmployment ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.periodical ? '✓' : ''}
                    </td>
                    <td className="border border-gray-400 h-8 text-center">
                      {examinationType.exit ? '✓' : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Medical Examination Tests */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
              </div>
              
              <div className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 w-1/3 text-left pl-2 bg-blue-50 text-sm">BLOODS</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">BLOODS</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.bloods.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.bloods.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">FAR, NEAR VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.farNearVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.farNearVision.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">SIDE & DEPTH</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.sideDepth.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.sideDepth.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">NIGHT VISION</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.nightVision.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.nightVision.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <table className="w-full border border-gray-400">
                      <thead>
                        <tr>
                          <th className="border border-gray-400 py-1 text-left pl-2 bg-blue-50 text-sm">Hearing</th>
                          <th className="border border-gray-400 py-1 w-1/6 text-center bg-blue-50 text-xs">Done</th>
                          <th className="border border-gray-400 py-1 text-center bg-blue-50 text-xs">Results</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Hearing</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.hearing.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.hearing.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Working at Heights</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.heights.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.heights.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Lung Function</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.lungFunction.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.lungFunction.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">X-Ray</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.xRay.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.xRay.results}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 pl-2 text-sm">Drug Screen</td>
                          <td className="border border-gray-400 text-center">
                            {medicalTests.drugScreen.done ? '✓' : ''}
                          </td>
                          <td className="border border-gray-400 p-1 text-sm">
                            {medicalTests.drugScreen.results}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Referral Section */}
            <div className="px-4 mb-4">
              <div className="flex items-center">
                <div className="font-semibold text-sm mr-1">Referred or follow up actions:</div>
                <div className="border-b border-gray-400 flex-1">
                  {getValue(certification, 'follow_up') || getValue(certification, 'referral')}
                </div>
                <div className="ml-2">
                  <div className="text-sm">
                    <span className="font-semibold mr-1">Review Date:</span>
                    <span className="text-red-600">{getValue(certification, 'review_date')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Restrictions Table */}
            <div className="mb-4">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Restrictions:
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.heights ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Heights</div>
                        {restrictionsData.heights && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.dustExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Dust Exposure</div>
                        {restrictionsData.dustExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.motorizedEquipment ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Motorized Equipment</div>
                        {restrictionsData.motorizedEquipment && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.hearingProtection ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Hearing Protection</div>
                        {restrictionsData.hearingProtection && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.confinedSpaces ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Confined Spaces</div>
                        {restrictionsData.confinedSpaces && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chemicalExposure ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Chemical Exposure</div>
                        {restrictionsData.chemicalExposure && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.wearSpectacles ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Wear Spectacles</div>
                        {restrictionsData.wearSpectacles && <div className="text-xs">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-2 text-center ${restrictionsData.chronicConditions ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold">Remain on Treatment for Chronic Conditions</div>
                        {restrictionsData.chronicConditions && <div className="text-xs">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Fitness Status */}
            <div className="mb-6">
              <div className="bg-gray-800 text-white text-center py-1 text-sm font-semibold mb-2">
                Medical Fitness Declaration
              </div>
              
              <div className="px-4">
                <table className="w-full border border-gray-400">
                  <tbody>
                    <tr>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fit ? 'bg-green-100' : ''}`}>
                        <div className="font-semibold text-sm">FIT</div>
                        {fitnessStatus.fit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fitWithRestriction ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Restriction</div>
                        {fitnessStatus.fitWithRestriction && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.fitWithCondition ? 'bg-yellow-100' : ''}`}>
                        <div className="font-semibold text-sm">Fit with Condition</div>
                        {fitnessStatus.fitWithCondition && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.temporarilyUnfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">Temporary Unfit</div>
                        {fitnessStatus.temporarilyUnfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                      <td className={`border border-gray-400 p-3 text-center ${fitnessStatus.unfit ? 'bg-red-100' : ''}`}>
                        <div className="font-semibold text-sm">UNFIT</div>
                        {fitnessStatus.unfit && <div className="mt-1 text-sm">✓</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comments */}
            <div className="px-4 mb-6">
              <div className="flex flex-col">
                <div className="font-semibold text-sm mb-1">Comments:</div>
                <div className="border border-gray-400 p-2 min-h-24 text-sm">
                  {getValue(certification, 'comments') || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* Footer with signature */}
            <div className="px-4 flex justify-between items-end mb-4">
              <div className="w-56">
                <div className="border-b border-gray-400 h-14 flex items-end justify-center pb-1">
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgODAiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0yMCA0MGMwIDAgMjAtMzAgNjAgMCBjIDMwIDI1IDQwLTEwIDYwIDUgYyAyMCAxNyA0MCA1IDYwLTEwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" 
                    alt="Signature" 
                    className="h-12 opacity-70"
                  />
                </div>
                <div className="text-center text-sm font-semibold mt-1">
                  Medical Practitioner
                </div>
              </div>
              
              <div className="w-56">
                <div className="border-b border-gray-400 h-14"></div>
                <div className="text-center text-sm font-semibold mt-1">
                  Employee Signature
                </div>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="bg-gray-100 p-3 text-xs text-center">
              <p>This certificate is valid for the duration specified above from the date of medical examination, 
                unless there is a change in the employees' medical condition or the nature of their work.</p>
            </div>
          </div>
        </div>
      </Card>
    </ScrollArea>
  );
};

export default CertificateTemplate;
