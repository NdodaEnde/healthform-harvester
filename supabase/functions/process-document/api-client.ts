
// API client for Landing AI and other services
export const apiClient = {
  // Call Landing AI API to process document
  async callLandingAI(file: File): Promise<any> {
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    
    if (!landingAiApiKey) {
      throw new Error('Landing AI API key is not configured');
    }
    
    console.log(`Calling Landing AI API for file: ${file.name} (Size: ${file.size} bytes)`);
    
    // API endpoint
    const apiUrl = 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';
    
    // Create form data for API request
    const apiFormData = new FormData();
    
    // Determine if we should use 'image' or 'pdf' based on file type
    const isPdf = file.type.includes('pdf');
    
    // Use the original file
    if (isPdf) {
      console.log('Adding PDF file to request');
      apiFormData.append('pdf', file, file.name);
    } else {
      console.log('Adding image file to request');
      apiFormData.append('image', file, file.name);
    }
    
    // Call Landing AI API with Basic Auth
    console.log(`Making request to Landing AI API with ${isPdf ? 'PDF' : 'image'} file`);
    console.log(`File name: ${file.name}, File type: ${file.type}, File size: ${file.size} bytes`);
    
    try {
      // Set longer timeout for large files (3 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`API call timed out after 3 minutes for file: ${file.name}`);
        controller.abort();
      }, 180000);
      
      console.log(`Starting API call to Landing AI at ${new Date().toISOString()}`);
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${landingAiApiKey}`
        },
        body: apiFormData,
        signal: controller.signal
      });
      
      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000;
      console.log(`API request completed in ${requestDuration.toFixed(2)} seconds`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: Status ${response.status}, Body: ${errorText}`);
        
        // Enhanced error reporting based on status code
        if (response.status === 429) {
          throw new Error(`Landing AI API rate limit exceeded. Please try again later.`);
        } else if (response.status === 413) {
          throw new Error(`File is too large for processing. Maximum file size is 10MB.`);
        } else if (response.status === 400) {
          throw new Error(`Landing AI API error: Invalid request - ${errorText}`);
        } else if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed with Landing AI API. Please check your API key.`);
        } else if (response.status >= 500) {
          throw new Error(`Landing AI API server error. Please try again later.`);
        } else {
          throw new Error(`Landing AI API error (${response.status}): ${errorText}`);
        }
      }
      
      const result = await response.json();
      console.log(`Successfully received response from Landing AI API for file: ${file.name}`);
      
      // IMPORTANT: Add direct extraction from markdown for certificate data
      if (result.data && result.data.markdown) {
        console.log("Found markdown data in API response, extracting certificate data");
        
        // Extract key data fields directly from markdown content
        const markdown = result.data.markdown;
        result.directExtraction = {
          patient: {},
          certification: {},
          examination: {
            type: {},
            tests: {}
          },
          restrictions: {}
        };
        
        // Extract patient name
        const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (nameMatch && nameMatch[1]) {
          result.directExtraction.patient.name = nameMatch[1].trim();
          console.log(`Extracted patient name: ${result.directExtraction.patient.name}`);
        }
        
        // Extract ID number
        const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (idMatch && idMatch[1]) {
          result.directExtraction.patient.id_number = idMatch[1].trim();
          console.log(`Extracted ID number: ${result.directExtraction.patient.id_number}`);
        }
        
        // Extract company name
        const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (companyMatch && companyMatch[1]) {
          result.directExtraction.patient.company = companyMatch[1].trim();
          console.log(`Extracted company: ${result.directExtraction.patient.company}`);
        }
        
        // Extract job title
        const jobMatch = markdown.match(/Job Title:\s*(.*?)(?=\n|\r|$)/i);
        if (jobMatch && jobMatch[1]) {
          result.directExtraction.patient.occupation = jobMatch[1].trim();
          console.log(`Extracted job title: ${result.directExtraction.patient.occupation}`);
        }
        
        // Extract examination date
        const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (examDateMatch && examDateMatch[1]) {
          result.directExtraction.certification.examination_date = examDateMatch[1].trim();
          console.log(`Extracted examination date: ${result.directExtraction.certification.examination_date}`);
        }
        
        // Extract expiry date
        const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$)/i);
        if (expiryDateMatch && expiryDateMatch[1]) {
          result.directExtraction.certification.valid_until = expiryDateMatch[1].trim();
          console.log(`Extracted expiry date: ${result.directExtraction.certification.valid_until}`);
        }
        
        // Extract examination type checkboxes
        const preEmploymentCheck = markdown.includes('PRE-EMPLOYMENT</th>') && markdown.match(/PRE-EMPLOYMENT[\s\S]*?\[x\]/i);
        const periodicalCheck = markdown.includes('PERIODICAL</th>') && markdown.match(/PERIODICAL[\s\S]*?\[x\]/i);
        const exitCheck = markdown.includes('EXIT</th>') && markdown.match(/EXIT[\s\S]*?\[x\]/i);
        
        result.directExtraction.examination.type = {
          pre_employment: !!preEmploymentCheck,
          periodical: !!periodicalCheck,
          exit: !!exitCheck
        };
        console.log(`Extracted examination type: pre_employment=${!!preEmploymentCheck}, periodical=${!!periodicalCheck}, exit=${!!exitCheck}`);
        
        // Extract test results
        const testMap = [
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
        
        testMap.forEach(test => {
          const testRegex = new RegExp(`<td>${test.name}</td>[\\s\\S]*?<td>\\[(x| )\\]</td>[\\s\\S]*?<td>([^<]*)</td>`, 'i');
          const match = markdown.match(testRegex);
          if (match) {
            result.directExtraction.examination.tests[`${test.key}_done`] = match[1].trim() === 'x';
            result.directExtraction.examination.tests[`${test.key}_results`] = match[2].trim();
            console.log(`Extracted test ${test.key}: done=${match[1].trim() === 'x'}, results=${match[2].trim()}`);
          }
        });
        
        // Extract fitness status
        const fitRegex = /<td>FIT<\/td>[\s\S]*?<td>\[(x| )\]<\/td>/i;
        const fitWithRestrictionRegex = /<td>Fit with Restriction<\/td>[\s\S]*?<td>\[(x| )\]<\/td>/i;
        const fitWithConditionRegex = /<td>Fit with Condition<\/td>[\s\S]*?<td>\[(x| )\]<\/td>/i;
        const temporarilyUnfitRegex = /<td>Temporary Unfit<\/td>[\s\S]*?<td>\[(x| )\]<\/td>/i;
        const unfitRegex = /<td>UNFIT<\/td>[\s\S]*?<td>\[(x| )\]<\/td>/i;
        
        const fitMatch = markdown.match(fitRegex);
        const fitWithRestrictionMatch = markdown.match(fitWithRestrictionRegex);
        const fitWithConditionMatch = markdown.match(fitWithConditionRegex);
        const temporarilyUnfitMatch = markdown.match(temporarilyUnfitRegex);
        const unfitMatch = markdown.match(unfitRegex);
        
        result.directExtraction.certification.fit = fitMatch ? fitMatch[1].trim() === 'x' : false;
        result.directExtraction.certification.fit_with_restrictions = fitWithRestrictionMatch ? fitWithRestrictionMatch[1].trim() === 'x' : false;
        result.directExtraction.certification.fit_with_condition = fitWithConditionMatch ? fitWithConditionMatch[1].trim() === 'x' : false;
        result.directExtraction.certification.temporarily_unfit = temporarilyUnfitMatch ? temporarilyUnfitMatch[1].trim() === 'x' : false;
        result.directExtraction.certification.unfit = unfitMatch ? unfitMatch[1].trim() === 'x' : false;
        
        console.log(`Extracted fitness status: fit=${result.directExtraction.certification.fit}, fit_with_restrictions=${result.directExtraction.certification.fit_with_restrictions}, fit_with_condition=${result.directExtraction.certification.fit_with_condition}, temporarily_unfit=${result.directExtraction.certification.temporarily_unfit}, unfit=${result.directExtraction.certification.unfit}`);
        
        // If no explicit fitness status found, try simpler check for the "FIT" word
        if (!result.directExtraction.certification.fit &&
            !result.directExtraction.certification.fit_with_restrictions &&
            !result.directExtraction.certification.fit_with_condition &&
            !result.directExtraction.certification.temporarily_unfit &&
            !result.directExtraction.certification.unfit) {
          
          // Alternative detection based on the "Figure Description" section that mentions "FIT"
          const fitFigureDesc = markdown.match(/word "FIT" prominently displayed/i);
          if (fitFigureDesc) {
            // Check if it mentions X crossing through, which would suggest "UNFIT"
            if (markdown.match(/large black "X" crossing through the word "FIT"/i)) {
              result.directExtraction.certification.unfit = true;
              console.log("Detected UNFIT status from figure description");
            } else {
              result.directExtraction.certification.fit = true;
              console.log("Detected FIT status from figure description");
            }
          }
        }
        
        // Extract restrictions
        const restrictionTypes = [
          { name: 'Heights', key: 'heights' },
          { name: 'Dust Exposure', key: 'dust_exposure' },
          { name: 'Motorized Equipment', key: 'motorized_equipment' },
          { name: 'Wear Hearing Protection', key: 'wear_hearing_protection' },
          { name: 'Confined Spaces', key: 'confined_spaces' },
          { name: 'Chemical Exposure', key: 'chemical_exposure' },
          { name: 'Wear Spectacles', key: 'wear_spectacles' },
          { name: 'Remain on Treatment for Chronic Conditions', key: 'remain_on_treatment_for_chronic_conditions' }
        ];
        
        restrictionTypes.forEach(restriction => {
          // Note: For limitations in the API response format, we may not be able to
          // reliably detect if checkboxes for restrictions are checked.
          // Let's check if the term appears in a context suggesting it's selected
          const restrictionRegex = new RegExp(`${restriction.name}[\\s\\S]*?\\[(x)\\]|\\[(x)\\][\\s\\S]*?${restriction.name}`, 'i');
          const match = markdown.match(restrictionRegex);
          
          result.directExtraction.restrictions[restriction.key] = !!match;
          
          if (match) {
            console.log(`Detected restriction: ${restriction.key}`);
          }
        });
      }
      
      // Log the actual full structure of the response for debugging
      console.log("Raw API Response (full data):", JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request was aborted due to timeout for file ${file.name}`);
        throw new Error(`Request timeout: Processing took too long for file ${file.name}. Try with a smaller file or try again later.`);
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error(`Network error when calling Landing AI API for file ${file.name}`);
        throw new Error(`Network error: Unable to connect to Landing AI. Please check your internet connection and try again.`);
      }
      
      console.error(`Error calling Landing AI API for file ${file.name}:`, error);
      throw error;
    }
  }
};
