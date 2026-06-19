import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DocumentInfo {
  document_id: string;
  filename: string;
  page_count: number;
  upload_date: string;
  file_size: number;
  text_preview?: string;
}

export default function PdfChat() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/pdf-chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload PDF');
      }

      const documentInfo = await response.json();
      setDocument(documentInfo);
      setChatHistory([]);
      
      toast({
        title: 'PDF Uploaded Successfully',
        description: `${documentInfo.filename} is ready for chat`,
      });

      // Auto-start conversation with a welcome message
      setChatHistory([{
        role: 'assistant',
        content: `Hello! I've successfully processed "${documentInfo.filename}" (${documentInfo.page_count} pages, ${formatBytes(documentInfo.file_size)}). I'm ready to answer questions about this document. You can ask me to summarize it, explain specific sections, or find information within it.`,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload PDF',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !document || isChatting) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsChatting(true);

    try {
      const response = await fetch('/api/pdf-chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: document.document_id,
          message: currentMessage,
          chat_history: chatHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const chatResponse = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: chatResponse.response,
        timestamp: chatResponse.timestamp
      };

      setChatHistory(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Chat Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearDocument = () => {
    setDocument(null);
    setChatHistory([]);
    setCurrentMessage('');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">PDF Chat</h1>
          <p className="text-muted-foreground mt-2">
            Upload a PDF document and chat with its content using AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Upload a PDF to start chatting with its content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to upload or drag and drop your PDF file
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select PDF File
                      </>
                    )}
                  </Button>
                </div>

                {document && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm truncate">
                          {document.filename}
                        </h3>
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>{document.page_count} pages</p>
                          <p>{formatBytes(document.file_size)}</p>
                          <p>Uploaded: {new Date(document.upload_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDocument}
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {document.text_preview && (
                      <div className="mt-3 p-2 bg-background rounded text-xs">
                        <p className="text-muted-foreground mb-1">Preview:</p>
                        <p className="line-clamp-3">{document.text_preview}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat with Document
                </CardTitle>
                <CardDescription>
                  Ask questions about your PDF content
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-6">
                  {!document ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Upload a PDF document to start chatting
                        </p>
                      </div>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">
                          Processing document...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((message, index) => (
                        <div key={index}>
                          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user' 
                                ? 'bg-primary text-primary-foreground ml-4' 
                                : 'bg-muted mr-4'
                            }`}>
                              <p className="whitespace-pre-wrap text-sm">
                                {message.content}
                              </p>
                              <p className={`text-xs mt-2 ${
                                message.role === 'user' 
                                  ? 'text-primary-foreground/70' 
                                  : 'text-muted-foreground'
                              }`}>
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isChatting && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3 mr-4">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Message Input */}
                <div className="p-4 bg-background">
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={document ? "Ask a question about your document..." : "Upload a PDF to start chatting"}
                      disabled={!document || isChatting}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!document || !currentMessage.trim() || isChatting}
                      size="sm"
                    >
                      {isChatting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {document && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Press Enter to send • Shift+Enter for new line
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}