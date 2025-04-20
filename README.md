# SEO Analysis Platform

A comprehensive SEO analysis and multilingual communication platform that provides advanced website performance insights and intelligent language transliteration capabilities.

## Features

- SEO analysis with detailed metrics and visualization
- Plagiarism checker
- Domain age and authority checkers
- Readability score analyzer
- Keyword density checker
- Custom font generator
- Image compressor
- Google transliteration with support for multiple languages
- Pre-Launch SEO Audit Tool (Premium)
- Competitor Content Gap Analyzer (Premium)
- API Testing Tool (Postman-style)

## Running the Application

This project consists of two parts:

1. **Main Application (Node.js)** - The SEO analysis platform
2. **API Testing Server (Python/FastAPI)** - Required only when using the API Testing tool

### Option 1: Run Both Servers at Once (Recommended)

For the best experience, especially when using the API Testing feature, use the provided shell script to start both servers simultaneously:

```bash
./run_all.sh
```

This script starts both the Node.js and Python servers and will stop both when you press Ctrl+C.

### Option 2: Run Servers Individually

#### Starting the Main Application

The main application runs automatically when you click the "Run" button in Replit, or you can start it manually:

```bash
npm run dev
```

This starts the Node.js server on port 5001 (or another available port).

#### Starting the API Testing Server

The API Testing server is a separate Python service that only needs to be running when you use the API Testing tool:

```bash
python start_api_server.py
```

This starts the FastAPI server on port 8000.

## Authentication

The platform includes a complete user authentication system. Premium features require authentication:

- Pre-Launch SEO Audit Tool
- Competitor Content Gap Analyzer

## API Testing Tool

The API Testing Tool allows you to:

- Test APIs with different HTTP methods
- Add headers, query parameters, and authentication
- Send different types of request bodies
- View response details, headers, and cookies
- Save request history

To use this feature:

1. Either run both servers at once using `./run_all.sh` (recommended)
   OR
   Start both servers individually:
   - Start the main application with `npm run dev`
   - Start the API Testing server with `python start_api_server.py`
2. Navigate to the API Tester page in the application
3. Build and execute API requests with the intuitive interface
4. View response details including status codes, headers, and body content

## Design

- Clean, material design interface
- Professional color scheme (blue, white, green)
- Mobile-responsive layout
- Comprehensive analysis with detailed metrics
- Visual presentation with highlighting and percentage charts

## Project Structure

- `client/` - React frontend
- `server/` - Node.js backend 
- `api_tester/` - Python FastAPI backend for API testing
- `shared/` - Shared types and schemas