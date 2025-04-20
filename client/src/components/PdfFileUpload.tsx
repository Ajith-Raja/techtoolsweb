import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfFileUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  currentFile?: File | null;
  onFileRemove?: () => void;
}

export function PdfFileUpload({
  onFileSelect,
  maxSize = 15,
  accept = '.pdf',
  multiple = false,
  disabled = false,
  currentFile = null,
  onFileRemove,
}: PdfFileUploadProps) {
  const { toast } = useToast();
  const inputId = `pdf-upload-${Math.random().toString(36).substring(7)}`;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      if (accept.includes('.pdf') && selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        toast({
          title: 'File too large',
          description: `Please upload a file smaller than ${maxSize}MB.`,
          variant: 'destructive',
        });
        return;
      }
      
      onFileSelect(selectedFile);
    }
  };

  return (
    <>
      {!currentFile ? (
        <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
          <Input
            type="file"
            accept={accept}
            id={inputId}
            className="hidden"
            onChange={handleFileChange}
            multiple={multiple}
            disabled={disabled}
          />
          <Label
            htmlFor={inputId}
            className="block cursor-pointer text-center"
          >
            <FileText className="h-8 w-8 mb-4 mx-auto text-muted-foreground" />
            <span className="font-medium text-primary block mb-1">
              Click to upload a PDF file
            </span>
            <span className="text-sm text-muted-foreground">
              or drag and drop here
            </span>
            <span className="block mt-2 text-xs text-muted-foreground">
              Maximum file size: {maxSize}MB
            </span>
          </Label>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="font-medium truncate">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          {onFileRemove && (
            <Button
              variant="outline"
              size="icon"
              onClick={onFileRemove}
              disabled={disabled}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </>
  );
}