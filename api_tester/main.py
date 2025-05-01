from fastapi import FastAPI, HTTPException, Request, Depends, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, List, Optional, Any, Union
import httpx
import json
import time
from datetime import datetime
import uuid
from enum import Enum
import os

app = FastAPI(title="API Testing Tool", description="A FastAPI backend for a Postman-like API testing tool")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include the share service router
try:
    from share_service import router as share_router
    app.include_router(share_router, prefix="/api", tags=["sharing"])
    print("API sharing endpoints enabled")
except ImportError as e:
    print(f"Warning: API sharing endpoints not available: {e}")

# In-memory storage (would be replaced with database in production)
class InMemoryDB:
    def __init__(self):
        self.requests_history = []
        self.collections = {}
        self.environments = {}

db = InMemoryDB()

class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"
    HEAD = "HEAD"

class BodyType(str, Enum):
    NONE = "none"
    RAW = "raw"
    FORM_DATA = "form-data"
    URLENCODED = "x-www-form-urlencoded"
    BINARY = "binary"

class RawBodyFormat(str, Enum):
    JSON = "json"
    XML = "xml"
    HTML = "html"
    TEXT = "text"

class ApiRequest(BaseModel):
    method: HttpMethod
    url: str
    headers: Optional[Dict[str, str]] = {}
    query_params: Optional[Dict[str, str]] = {}
    body_type: BodyType = BodyType.NONE
    raw_body_format: Optional[RawBodyFormat] = None
    body: Optional[Any] = None
    form_data: Optional[Dict[str, str]] = {}
    auth: Optional[Dict[str, str]] = {}

class ApiResponse(BaseModel):
    request_id: str
    request: ApiRequest
    status_code: int
    headers: Dict[str, str]
    body: Any
    cookies: Dict[str, str]
    time_taken: float  # in milliseconds
    size: int  # response size in bytes
    timestamp: datetime

class SavedRequest(BaseModel):
    id: str
    name: str
    request: ApiRequest

class Collection(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    requests: List[SavedRequest] = []

class Environment(BaseModel):
    id: str
    name: str
    variables: Dict[str, str] = {}

@app.get("/")
async def root():
    return {"message": "API Testing Tool API is running"}

@app.get("/s/{share_id}")
async def redirect_to_shared_request(share_id: str, request: Request):
    """
    Redirect to the API Tester UI with the shared request ID
    """
    # Get the base URL from the request
    base_url = str(request.base_url)
    if base_url.endswith("/"):
        base_url = base_url[:-1]  # Remove trailing slash
    
    # Frontend URL with the shared ID
    frontend_url = f"{base_url}/api-tester?share={share_id}"
    
    # Redirect to the frontend
    return RedirectResponse(url=frontend_url)

@app.post("/api/execute", response_model=ApiResponse)
async def execute_request(request: ApiRequest):
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Replace environment variables if they exist
    # This would be implemented to handle {{variable}} format
    
    # Build URL with query parameters
    url = request.url
    if request.query_params:
        # Append query params to URL
        if "?" not in url:
            url += "?"
        else:
            if not url.endswith("&") and not url.endswith("?"):
                url += "&"
        
        query_parts = []
        for key, value in request.query_params.items():
            if value:  # Only add if value is not empty
                query_parts.append(f"{key}={value}")
        
        url += "&".join(query_parts)
    
    # Prepare request
    headers = request.headers or {}
    
    # Handle authentication
    if request.auth:
        auth_type = request.auth.get("type")
        if auth_type == "basic":
            # Implement basic auth
            pass
        elif auth_type == "bearer":
            headers["Authorization"] = f"Bearer {request.auth.get('token', '')}"
        elif auth_type == "api_key":
            key_name = request.auth.get("key_name", "")
            key_value = request.auth.get("key_value", "")
            if request.auth.get("in") == "header":
                headers[key_name] = key_value
            else:  # in query
                if "?" not in url:
                    url += f"?{key_name}={key_value}"
                else:
                    url += f"&{key_name}={key_value}"
    
    # Execute the request
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            # Handle different body types
            data = None
            files = None
            json_data = None
            
            if request.body_type == BodyType.RAW and request.body:
                if request.raw_body_format == RawBodyFormat.JSON:
                    try:
                        json_data = request.body
                    except:
                        json_data = request.body  # Already in correct format
                else:
                    # Handle other raw formats (TEXT, XML, HTML)
                    data = request.body
            
            elif request.body_type == BodyType.FORM_DATA and request.form_data:
                # In a real implementation, this would handle file uploads too
                data = request.form_data
            
            elif request.body_type == BodyType.URLENCODED and request.form_data:
                data = request.form_data
            
            # Make the request
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                data=data,
                files=files,
                json=json_data,
                timeout=30.0  # 30 second timeout
            )
            
            # Calculate time taken
            time_taken = (time.time() - start_time) * 1000  # convert to ms
            
            # Convert headers to dict (httpx returns a Headers object)
            response_headers = dict(response.headers.items())
            
            # Get response size
            response_size = len(response.content)
            
            # Try to parse response body based on content type
            try:
                if "application/json" in response.headers.get("content-type", "").lower():
                    response_body = response.json()
                else:
                    response_body = response.text
            except:
                response_body = response.text
            
            # Get cookies
            cookies = dict(response.cookies)
            
            # Store in history
            api_response = ApiResponse(
                request_id=request_id,
                request=request,
                status_code=response.status_code,
                headers=response_headers,
                body=response_body,
                cookies=cookies,
                time_taken=time_taken,
                size=response_size,
                timestamp=datetime.now()
            )
            
            db.requests_history.append(api_response)
            
            return api_response
            
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/history", response_model=List[ApiResponse])
async def get_history():
    return db.requests_history

@app.post("/api/collections", response_model=Collection)
async def create_collection(collection: Collection):
    if not collection.id:
        collection.id = str(uuid.uuid4())
    db.collections[collection.id] = collection
    return collection

@app.get("/api/collections", response_model=List[Collection])
async def get_collections():
    return list(db.collections.values())

@app.get("/api/collections/{collection_id}", response_model=Collection)
async def get_collection(collection_id: str):
    if collection_id not in db.collections:
        raise HTTPException(status_code=404, detail="Collection not found")
    return db.collections[collection_id]

@app.post("/api/collections/{collection_id}/requests", response_model=SavedRequest)
async def add_request_to_collection(collection_id: str, request: SavedRequest):
    if collection_id not in db.collections:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if not request.id:
        request.id = str(uuid.uuid4())
    
    db.collections[collection_id].requests.append(request)
    return request

@app.post("/api/environments", response_model=Environment)
async def create_environment(environment: Environment):
    if not environment.id:
        environment.id = str(uuid.uuid4())
    db.environments[environment.id] = environment
    return environment

@app.get("/api/environments", response_model=List[Environment])
async def get_environments():
    return list(db.environments.values())

@app.get("/api/environments/{environment_id}", response_model=Environment)
async def get_environment(environment_id: str):
    if environment_id not in db.environments:
        raise HTTPException(status_code=404, detail="Environment not found")
    return db.environments[environment_id]

@app.put("/api/environments/{environment_id}", response_model=Environment)
async def update_environment(environment_id: str, environment: Environment):
    if environment_id not in db.environments:
        raise HTTPException(status_code=404, detail="Environment not found")
    
    environment.id = environment_id
    db.environments[environment_id] = environment
    return environment

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)