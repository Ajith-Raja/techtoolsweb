# API Testing Tool

A powerful Postman-like API testing tool built with FastAPI (backend) and React (frontend).

## Features

- **Request Builder**
  - Support for all major HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
  - URL input with auto-save and history
  - Headers input with key-value table
  - Query parameters
  - Body input:
    - Raw (JSON, XML, HTML, Text)
    - Form-data
    - x-www-form-urlencoded
    - Binary (file upload)

- **Response Viewer**
  - Status code with color indication
  - Response time and size
  - Headers viewer
  - Body viewer with pretty formatting for JSON
  - Cookies viewer

- **History & Collections**
  - Request history tracking
  - Collections feature to save and organize requests
  - Environment variables support

- **Authentication Support**
  - Basic Auth
  - Bearer Token
  - API Key

## Getting Started

### Starting the API Testing Server

To use the API Testing tool, you need to start the FastAPI server first:

```bash
python start_api_server.py
```

This will launch the server on http://localhost:8000.

### Using the API Testing Tool

1. Start the API testing server using the command above
2. In the main application, navigate to the API Tester page from the SEO Tools dropdown in the navigation
3. Enter your request details (URL, method, headers, etc.)
4. Click "Send" to execute the request
5. View the response in the bottom panel
6. Reference your request history on the right panel

## Architecture

- **Backend**: FastAPI provides REST endpoints for executing HTTP requests
- **Frontend**: React components integrated into the main application
- **Storage**: Uses in-memory storage for request history and collections during development

## Advanced Features (Coming Soon)

- Team Collaboration
- Mock Servers
- Auto Docs Generator
- Schedule & Monitor API Calls
- CLI tool
- CI/CD Integration

## Technical Details

### API Endpoints

- GET `/` - API health check
- POST `/api/execute` - Execute an HTTP request
- GET `/api/history` - Get request history
- POST `/api/collections` - Create a collection
- GET `/api/collections` - Get all collections
- GET `/api/collections/{collection_id}` - Get a specific collection
- POST `/api/collections/{collection_id}/requests` - Add a request to a collection
- POST `/api/environments` - Create an environment
- GET `/api/environments` - Get all environments
- GET `/api/environments/{environment_id}` - Get a specific environment
- PUT `/api/environments/{environment_id}` - Update an environment

## Contributing

Feel free to contribute to this project by submitting issues or pull requests.