// PDF Service - Handles communication with the PDF Tools API
import React from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { queryClient } from "./queryClient";
import { TOOLS_API_BASE_URL, TOOLS_WS_BASE_URL } from "./apiConfig";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// API base URL
const PDF_API_BASE_URL = TOOLS_API_BASE_URL;

// WebSocket base URL (for real-time progress tracking)
const WS_BASE_URL = TOOLS_WS_BASE_URL;

export interface PdfTaskResult {
  task_id: string;
  status: "success" | "error" | "processing" | "completed";
  download_url?: string;
  error_message?: string;
  result?: any;
}

export interface PdfProtectionPermissions {
  printing: boolean;
  copying: boolean;
  editing: boolean;
  annotating: boolean;
}

export interface PdfMetadataFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export interface PdfWatermarkOptions {
  watermarkType: 'text' | 'image';
  watermarkText?: string;
  watermarkImage?: File | null;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
  opacity: number;
  rotation: number;
  fontSize?: number;
  fontColor?: string;
  imageScale?: number;
}

export interface PdfProgress {
  task_id: string;
  progress: number;
  status: "processing" | "success" | "error" | "completed";
  error?: string;
  file?: string;
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
  | "pdf_to_word"
  | "word_to_pdf"
  | "edit_metadata"
  | "remove_pages";

/**
 * Create a WebSocket connection to track task progress
 */
export function createProgressWebSocket(taskId: string): WebSocket {
  if (!taskId) {
    throw new Error('Task ID is required to create WebSocket connection');
  }

  // Ensure the WebSocket URL is properly constructed
  const wsUrl = `${WS_BASE_URL}/ws/pdf/${taskId}`;
  console.log('Creating WebSocket connection to:', wsUrl);
  
  try {
    const socket = new WebSocket(wsUrl);
    
    // Add error handler to catch connection failures
    socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
      // Close the socket if it's in a bad state
      if (socket.readyState !== socket.OPEN) {
        socket.close(1000, 'Connection error');
      }
    };

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (socket.readyState !== socket.OPEN) {
        console.error('WebSocket connection timeout');
        socket.close(1000, 'Connection timeout');
      }
    }, 5000); // 5 second timeout

    socket.onopen = () => {
      console.log('WebSocket connection established');
      clearTimeout(connectionTimeout);
    };
    
    return socket;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    throw new Error('Failed to establish WebSocket connection');
  }
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

export async function getPdfPageCount(pdfFile: File): Promise<number> {
  const buffer = await pdfFile.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;
  return pdfDocument.numPages;
}

export async function getPdfMetadata(pdfFile: File): Promise<PdfMetadataFields> {
  const buffer = await pdfFile.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;
  const metadata = await pdfDocument.getMetadata().catch(() => null);

  const info = (metadata?.info as Record<string, unknown> | undefined) ?? {};
  return {
    title: String(info['Title'] || pdfFile.name.replace(/\.[^/.]+$/, '')),
    author: String(info['Author'] || ''),
    subject: String(info['Subject'] || ''),
    keywords: String(info['Keywords'] || ''),
    creator: String(info['Creator'] || ''),
    producer: String(info['Producer'] || ''),
  }
}

/**
 * Compress a PDF file
 */
export async function compressPdf(pdfFile: File, quality: number): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('quality', quality.toString());

  const response = await fetch(`${PDF_API_BASE_URL}/compress_pdf/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/pdf-to-images/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/images-to-pdf/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/extract-text/`, {
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
export async function extractImages(
  pdfFile: File,
  minSize: number,
  imageType: 'png' | 'jpeg' = 'png'
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('min_size', minSize.toString());
  formData.append('image_type', imageType);

  const response = await fetch(`${PDF_API_BASE_URL}/extract-images/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/merge-pdfs/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/split-pdf/`, {
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
  userPassword?: string,
  permissions?: PdfProtectionPermissions
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  
  formData.append('owner_password', ownerPassword);
  if (userPassword) {
    formData.append('user_password', userPassword);
  }

  if (permissions) {
    formData.append('allow_printing', String(permissions.printing));
    formData.append('allow_copying', String(permissions.copying));
    formData.append('allow_editing', String(permissions.editing));
    formData.append('allow_annotating', String(permissions.annotating));
  }

  const response = await fetch(`${PDF_API_BASE_URL}/add-password/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/remove-password/`, {
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
export async function addWatermark(pdfFile: File, options: PdfWatermarkOptions): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('watermark_type', options.watermarkType);
  formData.append('position', options.position);
  formData.append('opacity', options.opacity.toString());
  formData.append('rotation', options.rotation.toString());

  if (options.watermarkType === 'text') {
    formData.append('watermark_text', options.watermarkText || 'CONFIDENTIAL');
    formData.append('font_size', String(options.fontSize ?? 36));
    formData.append('font_color', options.fontColor || '#FF0000');
  } else if (options.watermarkImage) {
    formData.append('watermark_image', options.watermarkImage);
    formData.append('image_scale', String(options.imageScale ?? 0.25));
  }

  const response = await fetch(`${PDF_API_BASE_URL}/add-watermark/`, {
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
 * Update PDF metadata
 */
export async function editMetadata(pdfFile: File, metadata: PdfMetadataFields): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('title', metadata.title);
  formData.append('author', metadata.author);
  formData.append('subject', metadata.subject);
  formData.append('keywords', metadata.keywords);
  formData.append('creator', metadata.creator);
  formData.append('producer', metadata.producer);

  const response = await fetch(`${PDF_API_BASE_URL}/edit-metadata/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Failed to update metadata';
    try {
      const payload = await response.json();
      if (payload?.detail) {
        errorMessage = String(payload.detail);
      }
    } catch {
      // Keep generic fallback when response is not JSON.
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Remove selected pages from PDF
 */
export async function removePages(pdfFile: File, pageRanges: string): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('page_ranges', pageRanges);

  const response = await fetch(`${PDF_API_BASE_URL}/remove-pages/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to remove pages');
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
  pageRange?: string,
  pageRotations?: Record<number, number>
): Promise<string> {
  const formData = new FormData();
  formData.append('pdf_file', pdfFile);
  formData.append('angle', angle.toString());
  
  if (pageRange) {
    formData.append('page_range', pageRange);
  }

  if (pageRotations && Object.keys(pageRotations).length > 0) {
    formData.append('page_rotations', JSON.stringify(pageRotations));
  }

  console.log(formData)

  const response = await fetch(`${PDF_API_BASE_URL}/rotate-pages/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/reorder-pages/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/add-page-numbers/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/add-header-footer/`, {
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

  const response = await fetch(`${PDF_API_BASE_URL}/pdf-to-word/`, {
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
 * Convert Word to PDF
 */
export async function wordToPdf(wordFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('word_file', wordFile);

  const response = await fetch(`${PDF_API_BASE_URL}/word_to_pdf/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to convert Word to PDF');
  }

  const result = await response.json();
  return result.task_id;
}

/**
 * Hook to handle the WebSocket connection for real-time progress tracking
 */
export function usePdfProgress(taskId: string | null, onProgressUpdate: (progress: PdfProgress) => void) {
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = React.useRef(0);
  const socketRef = React.useRef<WebSocket | null>(null);
  const taskIdRef = React.useRef<string | null>(taskId);
  const onProgressRef = React.useRef(onProgressUpdate);
  const isClosingRef = React.useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const MAX_RECONNECT_DELAY = 5000;

  const closeSocket = React.useCallback((code: number, reason: string) => {
    if (socketRef.current && !isClosingRef.current) {
      isClosingRef.current = true;
      try {
        socketRef.current.close(code, reason);
      } catch (e) {
        console.error('Error closing socket:', e);
      } finally {
        socketRef.current = null;
        isClosingRef.current = false;
      }
    }
  }, []);

  React.useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  React.useEffect(() => {
    onProgressRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  React.useEffect(() => {
    if (!taskId) {
      closeSocket(1000, 'Task ID is null');
      return;
    }

    const connectWebSocket = () => {
      if (socketRef.current) {
        closeSocket(1000, 'Creating new connection');
      }

      try {
        const newSocket = createProgressWebSocket(taskId);
        socketRef.current = newSocket;

        newSocket.onopen = () => {
          console.log(`WebSocket connected for task ${taskId}`);
          reconnectAttemptsRef.current = 0;
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
        };

        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as PdfProgress;
            onProgressRef.current(data);
            
            // Close the socket if the task is completed
            if (['success', 'error', 'completed'].includes(data.status)) {
              console.log(`Task ${taskId} completed with status: ${data.status}`);
              closeSocket(1000, 'Task completed');
            }
          } catch (err) {
            console.error('Parse error:', err);
            onProgressRef.current({ task_id: taskId, progress: 0, status: 'error', error: 'Parse error' });
            closeSocket(1000, 'Parse error');
          }
        };

        newSocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          onProgressRef.current({ task_id: taskId, progress: 0, status: 'error', error: 'Connection error' });
          closeSocket(1000, 'Connection error');
        };

        newSocket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
          socketRef.current = null;
          isClosingRef.current = false;
        
          if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, MAX_RECONNECT_DELAY);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              connectWebSocket();
            }, delay);
          } else if (event.code !== 1000) {
            onProgressRef.current({
              task_id: taskId,
              progress: 0,
              status: 'error',
              error: 'Connection failed after multiple attempts',
            });
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        onProgressRef.current({
          task_id: taskId,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      closeSocket(1000, 'Component unmounting');
    };
  }, [taskId, closeSocket]);

  return socketRef.current;
}