
"""
Python Microservice for Document Processing with Landing AI
This is a template to help you get started with your Python microservice.
You'll need to customize this for your specific needs.

Installation:
- pip install fastapi uvicorn python-multipart pydantic supabase-py agentic-doc

Run with:
- uvicorn main:app --reload
"""

import os
import json
from typing import Dict, Any, Optional
import tempfile
from fastapi import FastAPI, HTTPException, Depends, Header
import httpx
from pydantic import BaseModel
import logging
from supabase import create_client, Client

# Import the Landing AI SDK (agentic-doc or whatever SDK you're using)
# from agentic_doc import LandingAI  # Import your actual SDK here

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Document Processing Microservice")

# API Key validation
def verify_api_key(authorization: str = Header(None)):
    api_key = os.environ.get("API_KEY")
    if not api_key:
        logger.error("API_KEY not set in environment variables")
        raise HTTPException(status_code=500, detail="API key not configured")
    
    if authorization != f"Bearer {api_key}":
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True

# Request model
class DocumentRequest(BaseModel):
    documentId: str
    documentType: str
    fileUrl: str
    fileName: str
    mimeType: str
    supabaseUrl: str
    supabaseServiceKey: str
    callbackEndpoint: str
    
# Response model
class ProcessingResponse(BaseModel):
    status: str
    message: str
    documentId: str

# Helper to initialize Supabase client
def get_supabase_client(supabase_url: str, supabase_key: str) -> Client:
    return create_client(supabase_url, supabase_key)

@app.post("/process-document", response_model=ProcessingResponse)
async def process_document(
    request: DocumentRequest, 
    api_key_valid: bool = Depends(verify_api_key)
):
    """
    Process a document using the Landing AI SDK and update results via callback
    """
    logger.info(f"Received document processing request for {request.fileName} (ID: {request.documentId})")
    
    try:
        # Download the document from the signed URL
        async with httpx.AsyncClient() as client:
            logger.info(f"Downloading file from {request.fileUrl}")
            response = await client.get(request.fileUrl)
            response.raise_for_status()
            
            # Save to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(request.fileName)[1]) as tmp_file:
                tmp_file.write(response.content)
                tmp_file_path = tmp_file.name
        
        logger.info(f"File downloaded to {tmp_file_path}")
        
        # Initialize the Landing AI client
        # landing_ai = LandingAI(api_key=os.environ.get("LANDING_AI_API_KEY"))
        
        # Process the document (replace this with your actual SDK code)
        # result = landing_ai.process_document(tmp_file_path)
        
        # For demonstration, we'll create a mock result
        mock_result = {
            "structured_data": {
                "patient": {
                    "name": "John Doe",
                    "gender": "male",
                    "date_of_birth": "1980-01-01",
                    "id_number": "ABC123456"
                },
                "examination_results": {
                    "date": "2023-05-15",
                    "type": {
                        "pre_employment": True,
                        "periodical": False,
                        "exit": False
                    }
                },
                "certification": {
                    "examination_date": "2023-05-15",
                    "valid_until": "2024-05-15"
                }
            },
            "raw_response": {
                "data": {
                    "markdown": "**Patient Name**: John Doe\n**Gender**: Male\n**Date of Birth**: 1980-01-01"
                }
            }
        }
        
        # Send results back to Supabase via the callback endpoint
        async with httpx.AsyncClient() as client:
            callback_payload = {
                "documentId": request.documentId,
                "status": "processed",
                "extractedData": mock_result
                # If there was an error: "processingError": "Description of what went wrong"
            }
            
            logger.info(f"Sending results to callback endpoint: {request.callbackEndpoint}")
            callback_response = await client.post(
                request.callbackEndpoint,
                json=callback_payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {os.environ.get('API_KEY')}"
                }
            )
            callback_response.raise_for_status()
            logger.info(f"Callback successful: {callback_response.status_code}")
        
        # Clean up the temporary file
        os.unlink(tmp_file_path)
        
        return {
            "status": "processing",
            "message": "Document processing started",
            "documentId": request.documentId
        }
        
    except httpx.HTTPError as e:
        logger.error(f"HTTP error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"HTTP error: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        
        # Try to notify Supabase of the failure
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    request.callbackEndpoint,
                    json={
                        "documentId": request.documentId,
                        "status": "failed",
                        "processingError": str(e)
                    },
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {os.environ.get('API_KEY')}"
                    }
                )
        except Exception as callback_error:
            logger.error(f"Failed to send error callback: {str(callback_error)}")
        
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processing-microservice"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
