#!/usr/bin/env python3
"""
API Request Sharing Service

This module provides functionality to share API requests via short URLs.
It uses Redis to store request data with a 15-day expiration period.
"""

import json
import redis
import shortuuid
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict, Optional

# Initialize router
router = APIRouter()

# Try to establish Redis connection
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()  # Test the connection
    print("Redis connection successful")
except redis.ConnectionError:
    print("Warning: Could not connect to Redis. Using in-memory fallback.")
    # Fallback to a dictionary for storage when Redis is not available
    in_memory_storage = {}

# Constants
EXPIRATION_DAYS = 15
URL_PREFIX = "share_"

# Models
class SharedRequest(BaseModel):
    """Model for a shared API request"""
    request_data: Dict[str, Any]


@router.post("/share", response_model=Dict[str, str])
async def share_request(shared_req: SharedRequest):
    """
    Save an API request and return a short ID for sharing
    """
    # Generate a short unique ID
    share_id = shortuuid.uuid()[:8]
    storage_key = f"{URL_PREFIX}{share_id}"
    
    # Store the request with expiration
    try:
        # Try to use Redis first
        if 'redis_client' in globals() and redis_client.ping():
            redis_client.set(
                storage_key, 
                json.dumps(shared_req.request_data),
                ex=timedelta(days=EXPIRATION_DAYS).total_seconds()
            )
        else:
            # Fallback to in-memory storage
            in_memory_storage[storage_key] = shared_req.request_data
            # Note: In-memory storage doesn't support expiration and will be lost on restart
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save request: {str(e)}")
    
    return {"share_id": share_id}


@router.get("/shared/{share_id}", response_model=Dict[str, Any])
async def get_shared_request(share_id: str):
    """
    Retrieve a shared API request by its ID
    """
    storage_key = f"{URL_PREFIX}{share_id}"
    
    try:
        # Try Redis first
        if 'redis_client' in globals() and redis_client.ping():
            stored_data = redis_client.get(storage_key)
        else:
            # Fallback to in-memory
            stored_data = in_memory_storage.get(storage_key)
            if stored_data:
                stored_data = json.dumps(stored_data)
        
        if not stored_data:
            raise HTTPException(status_code=404, detail="Shared request not found or has expired")
        
        return {"request_data": json.loads(stored_data)}
    except redis.RedisError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve shared request: {str(e)}")