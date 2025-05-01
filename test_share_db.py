"""
Test SQLite Share Functionality

This script tests the SQLite database functionality for the API tester share feature.
"""
import os
import json
import sys
import sqlite3
import datetime
import shortuuid

# Database setup
DB_PATH = "share_requests.db"

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

def share_request(request_data):
    """
    Save an API request and return a short ID for sharing
    """
    # Initialize the database
    init_db()
    
    # Generate a short unique ID
    share_id = shortuuid.uuid()[:8]
    storage_key = f"share_{share_id}"
    
    # Calculate timestamps
    now = datetime.datetime.now().isoformat()
    expires_at = (datetime.datetime.now() + datetime.timedelta(days=15)).isoformat()
    
    # Store the request with expiration
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO shared_requests (id, request_data, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (storage_key, json.dumps(request_data), now, expires_at)
        )
        conn.commit()
        conn.close()
        print(f"Request saved with ID: {share_id}")
        return share_id
    except Exception as e:
        print(f"Failed to save request: {str(e)}")
        return None

def get_shared_request(share_id):
    """
    Retrieve a shared API request by its ID
    """
    storage_key = f"share_{share_id}"
    
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
            print(f"Shared request not found or has expired: {share_id}")
            return None
        
        stored_data = result[0]  # Get the first column (request_data)
        print(f"Retrieved request data for {share_id}: {stored_data[:100]}...")
        return json.loads(stored_data)
    except sqlite3.Error as e:
        print(f"Database error: {str(e)}")
        return None
    except Exception as e:
        print(f"Failed to retrieve shared request: {str(e)}")
        return None

def list_all_requests():
    """List all shared requests in the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, created_at, expires_at FROM shared_requests")
        results = cursor.fetchall()
        conn.close()
        
        if not results:
            print("No shared requests found in the database")
            return
            
        print(f"Found {len(results)} shared requests:")
        for result in results:
            print(f"ID: {result[0]}, Created: {result[1]}, Expires: {result[2]}")
    except Exception as e:
        print(f"Error listing requests: {str(e)}")

def main():
    init_db()
    
    # Sample request data
    sample_request = {
        "method": "GET",
        "url": "https://jsonplaceholder.typicode.com/todos/1",
        "headers": {"Accept": "application/json"},
        "query_params": {},
        "body_type": "none"
    }
    
    # Create a new share
    share_id = share_request(sample_request)
    if share_id:
        print(f"Created shared request with ID: {share_id}")
        
        # Retrieve the shared request
        request_data = get_shared_request(share_id)
        if request_data:
            print(f"Retrieved request data matches: {request_data == sample_request}")
        
        # List all requests
        list_all_requests()
    else:
        print("Failed to create shared request")

if __name__ == "__main__":
    main()