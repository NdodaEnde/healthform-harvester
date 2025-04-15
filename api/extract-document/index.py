
from http.server import BaseHTTPRequestHandler
import json
import os
from typing import Optional
import tempfile
import logging
from landing_ai import DocumentExtraction

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self, api_key: str):
        self.client = DocumentExtraction(api_key=api_key)
    
    def process_file(self, file_path: str) -> dict:
        try:
            logger.info(f"Processing file: {file_path}")
            result = self.client.extract_document(file_path)
            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return {"success": False, "error": str(e)}

class handler(BaseHTTPRequestHandler):
    def handle_file_upload(self) -> Optional[str]:
        """Handle file upload and return temporary file path"""
        content_type = self.headers.get('Content-Type', '')
        
        if not content_type.startswith('multipart/form-data'):
            raise ValueError("Expected multipart/form-data")
            
        # Read content length
        content_length = int(self.headers.get('Content-Length', 0))
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False)
        temp_file.write(self.rfile.read(content_length))
        temp_file.close()
        
        return temp_file.name

    def do_POST(self):
        api_key = os.environ.get('LANDING_AI_API_KEY')
        if not api_key:
            self._send_error("Landing AI API key not configured")
            return

        try:
            # Handle file upload
            file_path = self.handle_file_upload()
            if not file_path:
                self._send_error("No file received")
                return

            # Process document
            processor = DocumentProcessor(api_key)
            result = processor.process_file(file_path)

            # Clean up temporary file
            try:
                os.unlink(file_path)
            except Exception as e:
                logger.error(f"Error removing temporary file: {str(e)}")

            # Send response
            if result["success"]:
                self._send_response(result["data"])
            else:
                self._send_error(result["error"])

        except Exception as e:
            logger.error(f"Error in request handler: {str(e)}")
            self._send_error(str(e))

    def do_GET(self):
        """Health check endpoint"""
        self._send_response({"status": "API is ready"})

    def _send_response(self, data: dict):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, message: str):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())
