
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
import uuid
import time
import threading
from typing import Dict, Any, Optional, List
import tempfile
from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile, Form
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

# =============================================================================
# BATCH STORAGE SYSTEM - FIXES 404 ERROR
# =============================================================================

# In-memory storage for batch results (temporary)
batch_storage = {}
storage_lock = threading.Lock()

def store_batch_result(batch_id: str, results: Dict) -> None:
    """Store batch results temporarily"""
    with storage_lock:
        batch_storage[batch_id] = {
            "results": results,
            "stored_at": time.time(),
            "status": "completed"
        }
        logger.info(f"[STORAGE] Stored batch {batch_id} with {len(results.get('results', []))} results")

def get_batch_result(batch_id: str) -> Optional[Dict]:
    """Retrieve stored batch results"""
    with storage_lock:
        return batch_storage.get(batch_id)

def cleanup_batch_result(batch_id: str) -> bool:
    """Remove stored batch results"""
    with storage_lock:
        if batch_id in batch_storage:
            del batch_storage[batch_id]
            logger.info(f"[STORAGE] Cleaned up batch {batch_id}")
            return True
        return False

def cleanup_old_batches():
    """Clean up batches older than 1 hour"""
    current_time = time.time()
    with storage_lock:
        expired_batches = [
            batch_id for batch_id, data in batch_storage.items()
            if current_time - data["stored_at"] > 3600  # 1 hour
        ]
        for batch_id in expired_batches:
            del batch_storage[batch_id]
        if expired_batches:
            logger.info(f"[STORAGE] Cleaned up {len(expired_batches)} expired batches")

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

# =============================================================================
# NEW ENDPOINTS TO FIX 404 ERROR
# =============================================================================

@app.post("/process-documents")
async def process_documents(files: List[UploadFile] = File(...)):
    """
    FIXED: Process multiple documents and return batch_id for later retrieval
    This endpoint matches what your edge function expects
    """
    logger.info(f"[BATCH] Processing {len(files)} files")
    
    try:
        cleanup_old_batches()  # Clean up old data
        
        batch_id = str(uuid.uuid4())[:8]  # Short batch ID
        results = []
        
        for file in files:
            if file.filename:
                logger.info(f"[BATCH {batch_id}] Processing {file.filename}")
                
                # Read file content
                file_content = await file.read()
                
                # Create mock processing result (replace with your actual processing)
                mock_result = {
                    "status": "success",
                    "filename": file.filename,
                    "data": {
                        "extraction_method": "enhanced_with_proven_serialization",
                        "document_type": "certificate-fitness",
                        "model_used": "CertificateOfFitness",
                        "processing_time": 1.5,
                        "file_size_mb": len(file_content) / (1024 * 1024),
                        "confidence_score": 0.952,
                        "structured_data": {
                            "employee_info": {
                                "full_name": "ATLAS TRUCKS M MAKHUBELA",
                                "company_name": "ATLAS TRUCKS",
                                "id_number": "9003076076087",
                                "job_title": "DRIVER"
                            },
                            "medical_examination": {
                                "examination_date": "14.03.2025",
                                "expiry_date": "14.03.2026",
                                "examination_type": "PERIODICAL",
                                "fitness_status": "FIT",
                                "restrictions_list": [],
                                "comments": None
                            },
                            "medical_tests": {
                                "vision_test": {"performed": True, "result": "20/20"},
                                "hearing_test": {"performed": True, "result": "NORMAL"},
                                "blood_test": {"performed": True, "result": "NORMAL"}
                            },
                            "medical_practitioner": {
                                "doctor_name": "Dr MJ Mphuthi",
                                "practice_number": "0404160",
                                "signature_present": True,
                                "stamp_present": True
                            }
                        },
                        "extraction_metadata": {},
                        "extraction_error": None
                    },
                    "processing_time": 1.5
                }
                
                results.append(mock_result)
        
        # Store results for later retrieval
        batch_data = {
            "batch_id": batch_id,
            "total_files": len(files),
            "successful_files": len(results),
            "failed_files": 0,
            "results": results,
            "status": "completed",
            "original_compatibility": True
        }
        
        store_batch_result(batch_id, batch_data)
        
        # Return just the batch_id (what edge function expects)
        return {
            "batch_id": batch_id,
            "document_count": len(files),
            "successful_count": len(results),
            "failed_count": 0,
            "processing_time_seconds": 2.0,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"[BATCH] Error processing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-document-data/{batch_id}")
async def get_document_data(batch_id: str):
    """
    FIXED: Retrieve processed document data by batch_id
    This endpoint was missing and causing the 404 error
    """
    logger.info(f"[BATCH] Retrieving data for batch {batch_id}")
    
    batch_data = get_batch_result(batch_id)
    
    if not batch_data:
        logger.error(f"[BATCH] Batch {batch_id} not found")
        raise HTTPException(status_code=404, detail="Batch ID not found")
    
    return batch_data["results"]

@app.delete("/cleanup/{batch_id}")
async def cleanup_batch(batch_id: str):
    """
    OPTIONAL: Clean up stored batch data
    """
    logger.info(f"[BATCH] Cleaning up batch {batch_id}")
    
    success = cleanup_batch_result(batch_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Batch ID not found")
    
    return {
        "status": "success",
        "message": "Batch cleaned up successfully",
        "batch_id": batch_id
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    cleanup_old_batches()  # Cleanup during health checks
    
    with storage_lock:
        active_batches = len(batch_storage)
    
    return {
        "status": "healthy", 
        "service": "document-processing-microservice",
        "batch_endpoints_fixed": True,
        "active_batches": active_batches,
        "endpoints": [
            "POST /process-documents",
            "GET /get-document-data/{batch_id}",
            "DELETE /cleanup/{batch_id}",
            "GET /health"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
