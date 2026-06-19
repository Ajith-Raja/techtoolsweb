import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  RotateCw,
  FileLock,
  Unlock,
  FileSignature,
  FileStack,
  FilePlus,
  ScissorsSquare,
  Stamp,
  FileOutput,
  FileInput,
  Image,
  MessageSquare
} from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function ToolCard({ title, description, icon, href }: ToolCardProps) {
  return (
    <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-muted-foreground/20">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <span className="p-2 rounded-md bg-primary/10 mr-3">
            {icon}
          </span>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Link href={href}>
          <Button className="w-full" variant="outline">
            Open Tool
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function PdfToolsHome() {
  const pdfTools = [
    {
      title: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: <FileText className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/compress'
    },
    {
      title: 'PDF to Word',
      description: 'Convert PDF files to editable Word documents',
      icon: <FileOutput className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/pdf-to-word'
    },
    {
      title: 'PDF to Image',
      description: 'Convert PDF pages to JPG or PNG images',
      icon: <Image className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/pdf-to-image'
    },
    {
      title: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      icon: <FileInput className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/word-to-pdf'
    },
    {
      title: 'Extract Text',
      description: 'Extract text content from PDF documents',
      icon: <FileText className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/extract-text'
    },
    {
      title: 'Extract Images',
      description: 'Extract all images from PDF files',
      icon: <Image className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/extract-images'
    },
    {
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one document',
      icon: <FileStack className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/merge'
    },
    {
      title: 'Split PDF',
      description: 'Split PDF into multiple files by pages',
      icon: <ScissorsSquare className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/split'
    },
    {
      title: 'Reorder Pages',
      description: 'Change the order of pages in a PDF document',
      icon: <FilePlus className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/reorder'
    },
    {
      title: 'Rotate PDF',
      description: 'Rotate pages in a PDF document',
      icon: <RotateCw className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/rotate'
    },
    {
      title: 'Protect PDF',
      description: 'Add password protection to your PDF files',
      icon: <FileLock className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/protect'
    },
    {
      title: 'Unlock PDF',
      description: 'Remove password protection from PDF files',
      icon: <Unlock className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/unlock'
    },
    {
      title: 'Add Watermark',
      description: 'Add text or image watermarks to PDF pages',
      icon: <Stamp className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/watermark'
    },
    {
      title: 'Edit Metadata',
      description: 'View and edit PDF document properties',
      icon: <FileSignature className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/metadata'
    },
    {
      title: 'Remove Pages',
      description: 'Delete selected pages from a PDF document',
      icon: <ScissorsSquare className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/remove-pages'
    },
    {
      title: 'PDF Chat',
      description: 'Chat with your PDF documents using AI',
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      href: '/pdf-tools/chat'
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4">PDF Tools</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A comprehensive collection of tools to work with PDF files. Compress, convert, 
          edit, and manage your PDF documents with ease.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pdfTools.map((tool) => (
          <ToolCard
            key={tool.title}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            href={tool.href}
          />
        ))}
      </div>
    </div>
  );
}