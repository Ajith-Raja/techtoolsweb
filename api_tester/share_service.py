#!/usr/bin/env python3
"""
API Request Sharing Service

This module provides functionality to share API requests via short URLs.
It uses SQLite to store request data with a 15-day expiration period.
"""

import json
import os
import sqlite3
import shortuuid
import datetime
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict, Optional

# Initialize router
router = APIRouter()

# Database setup
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "share_requests.db")

def init_db():
    """Initialize the SQLite database with required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS shared_requests (
        id TEXT PRIMARY KEY,
        request_data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    ''')
    conn.commit()
    conn.close()
    print(f"SQLite database initialized at {DB_PATH}")

# Initialize database
init_db()

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
    
    # Calculate timestamps
    now = datetime.datetime.now().isoformat()
    expires_at = (datetime.datetime.now() + datetime.timedelta(days=EXPIRATION_DAYS)).isoformat()
    
    # Store the request with expiration
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO shared_requests (id, request_data, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (storage_key, json.dumps(shared_req.request_data), now, expires_at)
        )
        conn.commit()
        conn.close()
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
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # First, remove expired entries
        now = datetime.datetime.now().isoformat()
        cursor.execute("DELETE FROM shared_requests WHERE expires_at < ?", (now,))
        conn.commit()
        
        # Then fetch the requested item
        cursor.execute("SELECT request_data FROM shared_requests WHERE id = ?", (storage_key,))
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Shared request not found or has expired")
        
        stored_data = result[0]  # Get the first column (request_data)
        
        return {"request_data": json.loads(stored_data)}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve shared request: {str(e)}")