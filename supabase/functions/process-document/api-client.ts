
// API client for Landing AI and other services
export const apiClient = {
  // Call Landing AI API to process document
  async callLandingAI(file: File): Promise<any> {
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    const processingServiceUrl = Deno.env.get('LANDING_AI_SDK_SERVICE_URL');
    
    if (!landingAiApiKey) {
      console.error('Landing AI API key is not configured');
      throw new Error('Landing AI API key is not configured');
    }
    
    console.log(`Processing file: ${file.name} (Size: ${file.size} bytes, Type: ${file.type})`);
    console.log(`SDK Processing URL configured: ${processingServiceUrl ? 'Yes' : 'No'}`);
    
    // Determine if this is a large document that requires SDK processing
    const isPdf = file.type.includes('pdf');
    const isLargeDocument = file.size > 5000000; // 5MB threshold
    const forceSDK = Deno.env.get('FORCE_SDK_PROCESSING') === 'true';
    
    try {
      console.log(`Starting document processing at ${new Date().toISOString()}`);
      console.log(`Using processing strategy: ${(isPdf && isLargeDocument) || forceSDK ? 'SDK Service' : 'Direct API'}`);
      const startTime = Date.now();
      
      // For large PDF documents or when specifically requested, use the SDK service
      if (((isPdf && isLargeDocument) || forceSDK) && processingServiceUrl) {
        console.log('Document is large or complex. Using Landing AI SDK processing service.');
        console.log(`SDK Service URL: ${processingServiceUrl}`);
        
        // Create form data for SDK service request
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('api_key', landingAiApiKey);
        
        // Set longer timeout for large files (5 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error(`SDK service call timed out after 5 minutes for file: ${file.name}`);
          controller.abort();
        }, 300000); // 5 minutes
        
        console.log(`Sending request to SDK service at: ${new Date().toISOString()}`);
        const response = await fetch(processingServiceUrl, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`SDK Service Error: Status ${response.status}, Body: ${errorText}`);
          
          // Enhanced error handling based on status code
          if (response.status === 429) {
            throw new Error(`SDK service rate limit exceeded. Please try again later.`);
          } else if (response.status === 413) {
            throw new Error(`File is too large for processing. Maximum file size is 50MB.`);
          } else if (response.status >= 500) {
            throw new Error(`SDK service server error (${response.status}). Please try again later.`);
          } else {
            throw new Error(`SDK Processing failed (${response.status}): ${errorText}`);
          }
        }
        
        console.log(`SDK service response received at: ${new Date().toISOString()}`);
        const responseContentType = response.headers.get('content-type');
        console.log(`SDK response content type: ${responseContentType}`);
        
        const result = await response.json();
        const endTime = Date.now();
        const requestDuration = (endTime - startTime) / 1000;
        console.log(`SDK processing completed in ${requestDuration.toFixed(2)} seconds`);
        
        return result;
      } else {
        // Fallback to direct API for smaller documents or non-PDFs
        console.log('Using direct Landing AI API for processing.');
        
        if (!processingServiceUrl && (isPdf && isLargeDocument)) {
          console.warn('Large PDF detected but SDK service URL is not configured. Falling back to direct API which may fail for very large documents.');
        }
        
        // API endpoint
        const apiUrl = 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';
        
        // Create form data for API request
        const apiFormData = new FormData();
        
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
        console.log(`API request started at: ${new Date().toISOString()}`);
        
        // Set longer timeout for large files (3 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error(`API call timed out after 3 minutes for file: ${file.name}`);
          controller.abort();
        }, 180000);
        
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
        
        const responseContentType = response.headers.get('content-type');
        console.log(`API response content type: ${responseContentType}`);
        
        const result = await response.json();
        console.log(`Successfully received response from Landing AI API for file: ${file.name}`);
        return result;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request was aborted due to timeout for file ${file.name}`);
        throw new Error(`Request timeout: Processing took too long for file ${file.name}. Try with a smaller file or try again later.`);
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error(`Network error when calling processing service for file ${file.name}`);
        throw new Error(`Network error: Unable to connect to document processing service. Please check your internet connection and try again.`);
      }
      
      console.error(`Error processing document file ${file.name}:`, error);
      throw error;
    }
  }
};
