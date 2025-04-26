// PDF Service - Handles communication with the PDF Tools API
import React from 'react';
import { queryClient } from "./queryClient";

// API base URL
const PDF_API_BASE_URL = "http://localhost:8001";

// WebSocket base URL (for real-time progress tracking)
const WS_BASE_URL = "ws://localhost:8001";

export interface PdfTaskResult {
  task_id: string;
  status: "success" | "error" | "processing";
  download_url?: string;
  error_message?: string;
  result?: any;
}

export interface PdfProgress {
  task_id: string;
  progress: number;
  status: "processing" | "success" | "error";
  error?: string;
}

export type PdfTask = 
  | "compress_pdf" 
  | "pdf_to_images" 
  | "images_to_pdf" 
  | "extract_text" 
  | "extract_images" 
  | "merge_pdfs" 
  | "split_pdf" 
  | "add_password" 
  | "remove_password" 
  | "add_watermark" 
  | "rotate_pages" 
  | "reorder_pages" 
  | "add_page_numbers" 
  | "add_header_footer" 
  | "pdf_to_word";

/**
 * Create a WebSocket connection to track task progress
 */
export function createProgressWebSocket(taskId: string): WebSocket {
  const socket = new WebSocket(`${WS_BASE_URL}/ws/${taskId}`);
  return socket;
}

/**
 * Check the status of a PDF processing task
 */
export async function checkTaskStatus(taskId: string): Promise<PdfTaskResult> {
  const response = await fetch(`${PDF_API_BASE_URL}/task/${taskId}`);
  if (!response.ok) {
    throw new Error('Failed to check task status');
  }
  return await response.json();
}

/**
 * Get the download URL for a completed task
 */
export function getDownloadUrl(taskId: string): string {
  return `${PDF_API_BASE_URL}/download/${taskId}`;
}

/**
 * Compress a PDF file
 */
export async function compressPdf(pdfFile: File, quality: number): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('quality', quality.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/compress_pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to compress PDF');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Convert PDF to images
 */
export async function pdfToImages(pdfFile: File, dpi: number, format: string): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('dpi', dpi.toString());
  formData.append('format', format);

  const response = await fetch(`${PDF_API_BASE_URL}/pdf_to_images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to convert PDF to images');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Convert images to PDF
 */
export async function imagesToPdf(images: File[], pageSize: string, margin: number): Promise<string> {
  const formData = new FormData();
  images.forEach(image => {
    formData.append('images', image);
  });
  formData.append('page_size', pageSize);
  formData.append('margin', margin.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/images_to_pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to convert images to PDF');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Extract text from PDF
 */
export async function extractText(pdfFile: File, pageRange?: string): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  if (pageRange) {
    formData.append('page_range', pageRange);
  }

  const response = await fetch(`${PDF_API_BASE_URL}/extract_text`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract text');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Extract images from PDF
 */
export async function extractImages(pdfFile: File, minSize: number): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('min_size', minSize.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/extract_images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract images');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Merge multiple PDFs
 */
export async function mergePdfs(pdfFiles: File[]): Promise<string> {
  const formData = new FormData();
  pdfFiles.forEach(file => {
    formData.append('pdf_files', file);
  });

  const response = await fetch(`${PDF_API_BASE_URL}/merge_pdfs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to merge PDFs');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Split PDF
 */
export async function splitPdf(
  pdfFile: File, 
  splitMethod: string, 
  pagesPerPdf?: number, 
  pageRanges?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('split_method', splitMethod);
  
  if (pagesPerPdf) {
    formData.append('pages_per_pdf', pagesPerPdf.toString());
  }
  
  if (pageRanges) {
    formData.append('page_ranges', pageRanges);
  }

  const response = await fetch(`${PDF_API_BASE_URL}/split_pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to split PDF');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Add password protection to PDF
 */
export async function addPassword(
  pdfFile: File, 
  ownerPassword: string, 
  userPassword?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  
  const passwordData = {
    owner_password: ownerPassword,
    user_password: userPassword
  };
  
  formData.append('password', JSON.stringify(passwordData));

  const response = await fetch(`${PDF_API_BASE_URL}/add_password`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to add password');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Remove password from PDF
 */
export async function removePassword(pdfFile: File, password: string): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('password', password);

  const response = await fetch(`${PDF_API_BASE_URL}/remove_password`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to remove password');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Add watermark to PDF
 */
export async function addWatermark(
  pdfFile: File, 
  watermarkText: string, 
  position: string, 
  opacity: number, 
  rotation: number
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('watermark_text', watermarkText);
  formData.append('position', position);
  formData.append('opacity', opacity.toString());
  formData.append('rotation', rotation.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/add_watermark`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to add watermark');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Rotate PDF pages
 */
export async function rotatePages(
  pdfFile: File, 
  angle: number, 
  pageRange?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('angle', angle.toString());
  
  if (pageRange) {
    formData.append('page_range', pageRange);
  }

  const response = await fetch(`${PDF_API_BASE_URL}/rotate_pages`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to rotate pages');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Reorder PDF pages
 */
export async function reorderPages(pdfFile: File, pageOrder: string): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('page_order', pageOrder);

  const response = await fetch(`${PDF_API_BASE_URL}/reorder_pages`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to reorder pages');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  pdfFile: File, 
  position: string, 
  startNumber: number, 
  fontSize: number
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('position', position);
  formData.append('start_number', startNumber.toString());
  formData.append('font_size', fontSize.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/add_page_numbers`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to add page numbers');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Add header/footer to PDF
 */
export async function addHeaderFooter(
  pdfFile: File, 
  headerText?: string, 
  footerText?: string, 
  fontSize: number = 10
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  
  if (headerText) {
    formData.append('header_text', headerText);
  }
  
  if (footerText) {
    formData.append('footer_text', footerText);
  }
  
  formData.append('font_size', fontSize.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/add_header_footer`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to add header/footer');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Convert PDF to Word
 */
export async function pdfToWord(pdfFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);

  const response = await fetch(`${PDF_API_BASE_URL}/pdf_to_word`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to convert PDF to Word');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Hook to handle the WebSocket connection for real-time progress tracking
 */
export function usePdfProgress(taskId: string | null, onProgressUpdate: (progress: PdfProgress) => void) {
  const [socket, setSocket] = React.useState<WebSocket | null>(null);

  React.useEffect(() => {
    if (!taskId) return;

    // Create WebSocket connection
    const newSocket = createProgressWebSocket(taskId);
    
    // Set up event handlers
    newSocket.onopen = () => {
      console.log(`WebSocket connection established for task ${taskId}`);
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data) as PdfProgress;
      onProgressUpdate(data);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      onProgressUpdate({
        task_id: taskId,
        progress: 0,
        status: 'error',
        error: 'Connection error'
      });
    };
    
    newSocket.onclose = () => {
      console.log(`WebSocket connection closed for task ${taskId}`);
    };
    
    setSocket(newSocket);
    
    // Cleanup function
    return () => {
      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [taskId, onProgressUpdate]);

  return socket;
}