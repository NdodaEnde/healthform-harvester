
// API client for Landing AI and other services
export const apiClient = {
  // Call Landing AI API to process document
  async callLandingAI(file: File): Promise<any> {
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    
    if (!landingAiApiKey) {
      throw new Error('Landing AI API key is not configured');
    }
    
    console.log(`Calling Landing AI API for file: ${file.name}`);
    
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
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${landingAiApiKey}`
        },
        body: apiFormData,
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(120000) // 2 minutes timeout
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: Status ${response.status}, Body: ${errorText}`);
        throw new Error(`Landing AI API error (${response.status}): ${errorText}`);
      }
      
      console.log('Successfully received response from Landing AI API');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling Landing AI API:', error);
      throw error;
    }
  }
};
