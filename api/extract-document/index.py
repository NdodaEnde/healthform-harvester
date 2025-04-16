
from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import logging
from agentic_doc.parse import parse_documents
from agentic_doc.common import ChunkType

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure SDK optimization settings
os.environ["BATCH_SIZE"] = "20"  # Higher batch size for processing multiple documents
os.environ["MAX_WORKERS"] = "5"  # Max workers per document processing
os.environ["MAX_RETRIES"] = "100"  # Maximum retry attempts
os.environ["RETRY_LOGGING_STYLE"] = "inline_block"  # More compact logging

class DocumentProcessor:
    def __init__(self, api_key: str):
        # Set the API key for agentic-doc
        os.environ["LANDING_AI_API_KEY"] = api_key
        # Optional: Set OpenAI API key if available for enhanced analysis
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        if openai_api_key:
            os.environ["OPENAI_API_KEY"] = openai_api_key
    
    def process_file(self, file_path: str) -> dict:
        try:
            logger.info(f"Processing file: {file_path}")
            # Use agentic-doc to parse the document
            results = parse_documents([file_path])
            
            if not results:
                return {"success": False, "error": "No results returned from document parsing"}
            
            # Process chunks into a structured format
            processed_chunks = []
            page_map = {}
            
            for chunk in results.chunks:
                chunk_data = {
                    "text": chunk.text,
                    "metadata": chunk.metadata,
                    "chunk_type": str(chunk.chunk_type),
                    "groundings": []
                }
                
                # Process groundings (bounding boxes)
                for grounding in chunk.grounding:
                    # Convert to 1-based page indexing for consistency
                    page_idx = grounding.page + 1
                    
                    # Extract bounding box
                    if grounding.box:
                        box = grounding.box
                        x, y = box.l, box.t
                        w, h = box.r - box.l, box.b - box.t
                        
                        # Add to page map for page-based retrieval
                        if page_idx not in page_map:
                            page_map[page_idx] = []
                        
                        page_map[page_idx].append({
                            "bboxes": [[x, y, w, h]],
                            "captions": [chunk.text]
                        })
                        
                        # Add to chunk groundings
                        chunk_data["groundings"].append({
                            "page": page_idx,
                            "box": [x, y, w, h],
                            "image_path": grounding.image_path if hasattr(grounding, "image_path") else None
                        })
                
                processed_chunks.append(chunk_data)
            
            return {
                "success": True,
                "data": {
                    "markdown": results.markdown,
                    "chunks": processed_chunks,
                    "page_map": page_map
                }
            }
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def analyze_with_ai(self, query: str, document_data: dict) -> dict:
        """
        Use OpenAI to analyze the document data based on a user query.
        This is optional and only runs if OPENAI_API_KEY is configured.
        """
        try:
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            if not openai_api_key:
                return {"success": False, "error": "OpenAI API key not configured"}
            
            from openai import OpenAI
            
            # Prepare evidence from document data
            evidence = json.dumps(document_data.get("page_map", {}), indent=2)
            
            prompt = f"""
            Use the following JSON evidence extracted from the uploaded document, answer the following question based on that evidence.
            Please return your response in JSON format with three keys: 
            1. "answer": Your detailed answer to the question
            2. "reasoning": Your step-by-step reasoning process
            3. "best_chunks": A list of objects with page, bboxes, and captions that support your answer
            
            Question: {query}

            Evidence: {evidence}
            """
            
            client = OpenAI(api_key=openai_api_key)
            chat_response = client.chat.completions.create(
                model="gpt-4o",  # Using a capable model for analysis
                messages=[
                    {
                        "role": "system",
                        "content": ("You are a helpful expert that analyses document context deeply "
                                   "and reasons through it without assuming anything.")
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            
            raw = chat_response.choices[0].message.content.strip()
            # Clean up any code block markup
            if raw.startswith("```"):
                lines = raw.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                raw = "\n".join(lines).strip()
            
            parsed = json.loads(raw)
            return {"success": True, "analysis": parsed}
        except Exception as e:
            logger.error(f"Error analyzing with AI: {str(e)}")
            return {"success": False, "error": str(e)}

class handler(BaseHTTPRequestHandler):
    def handle_file_upload(self):
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

            # Check if there's a query parameter for AI analysis
            content_type = self.headers.get('Content-Type', '')
            query = None
            
            if 'query=' in self.path:
                import urllib.parse
                query_string = self.path.split('?', 1)[1]
                params = urllib.parse.parse_qs(query_string)
                query = params.get('query', [''])[0]

            # Process document
            processor = DocumentProcessor(api_key)
            result = processor.process_file(file_path)

            # Clean up temporary file
            try:
                os.unlink(file_path)
            except Exception as e:
                logger.error(f"Error removing temporary file: {str(e)}")

            # If processing was successful and there's a query, analyze with AI
            if result["success"] and query and os.environ.get('OPENAI_API_KEY'):
                analysis_result = processor.analyze_with_ai(query, result["data"])
                if analysis_result["success"]:
                    result["data"]["ai_analysis"] = analysis_result["analysis"]

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
        self._send_response({"status": "Document extraction API is ready"})

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
