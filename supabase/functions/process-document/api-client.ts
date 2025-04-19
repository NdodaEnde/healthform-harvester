
// API client for Document Processing Service and Landing AI
export const apiClient = {
  // Call SDK Microservice for document processing
  async callSDKService(file: File, documentType: string, documentId?: string): Promise<any> {
    const sdkServiceUrl = Deno.env.get('SDK_MICROSERVICE_URL');
    
    if (!sdkServiceUrl) {
      throw new Error('SDK Microservice URL is not configured');
    }
    
    console.log(`Calling SDK Microservice for file: ${file.name} (Size: ${file.size} bytes)`);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    
    if (documentId) {
      formData.append("document_id", documentId);
    }
    
    try {
      // Set longer timeout for large files (3 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`API call timed out after 3 minutes for file: ${file.name}`);
        controller.abort();
      }, 180000);
      
      console.log(`Starting SDK service call at ${new Date().toISOString()}`);
      const startTime = Date.now();
      
      const response = await fetch(`${sdkServiceUrl}/process-document`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      const endTime = Date.now();
      const requestDuration = (endTime - startTime) / 1000;
      console.log(`SDK service request completed in ${requestDuration.toFixed(2)} seconds`);
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SDK Service Error: Status ${response.status}, Body: ${errorText}`);
        throw new Error(`SDK Service error (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`Successfully received response from SDK service for file: ${file.name}`);
      return result;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`Request was aborted due to timeout for file ${file.name}`);
        throw new Error(`Request timeout: Processing took too long for file ${file.name}. Try with a smaller file or try again later.`);
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error(`Network error when calling SDK service for file ${file.name}`);
        throw new Error(`Network error: Unable to connect to SDK service. Please check service availability and try again.`);
      }
      
      console.error(`Error calling SDK service for file ${file.name}:`, error);
      throw error;
    }
  },

  // Call Landing AI API for document processing
  async callLandingAI(file: File, documentType?: string, documentId?: string): Promise<any> {
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    
    // If SDK_MICROSERVICE_URL is configured, use the SDK service instead
    const sdkServiceUrl = Deno.env.get('SDK_MICROSERVICE_URL');
    if (sdkServiceUrl) {
      console.log('SDK microservice URL found, redirecting to SDK service');
      return this.callSDKService(file, documentType || 'unknown', documentId);
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
