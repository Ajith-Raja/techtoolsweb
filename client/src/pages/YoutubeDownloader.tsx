import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoInfo, VideoFormat, youtubeInfoSchema } from '@shared/schema';
import { Loader2, DownloadCloud, FileVideo, Play } from 'lucide-react';
import { formatBytes, formatDuration } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  url: z.string().url('Please enter a valid URL').refine(
    url => url.includes('youtube.com') || url.includes('youtu.be'),
    { message: 'URL must be a valid YouTube URL' }
  )
});

export default function YoutubeDownloader() {
  const { toast } = useToast();
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [downloadId, setDownloadId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('video');

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: ''
    }
  });

  // Get video info
  const fetchVideoInfo = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      setVideoInfo(null);
      
      const response = await fetch('http://localhost:8001/youtube/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch video info');
      }
      
      const data = await response.json();
      setVideoInfo(data);
      
      // Auto select best format if available
      if (data.formats.length > 0) {
        setSelectedFormat(data.formats[0].format_id);
      }
      
    } catch (error) {
      console.error('Error fetching video info:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start download
  const startDownload = async () => {
    if (!videoInfo || !selectedFormat) {
      toast({
        title: 'Error',
        description: 'Please select a format first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      
      const videoUrl = videoInfo.formats.filter((e) => e.format_id === selectedFormat)[0].url;
      window.open(
      videoUrl,
      '_blank'
      );
      // setDownloadStatus('starting');
      // setDownloadProgress(0);
      
      // const response = await fetch('http://localhost:8000/api/youtube/download', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     url: videoInfo.id.includes('youtube.com') ? videoInfo.id : `https://www.youtube.com/watch?v=${videoInfo.id}`,
      //     format_id: selectedFormat
      //   }),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to start download');
      // }
      
      // const data = await response.json();
      // setDownloadId(data.download_id);
      // setDownloadStatus(data.status);
      
      // // Poll for status updates
      // if (data.status === 'downloading' || data.status === 'starting') {
      //   pollDownloadStatus(data.download_id);
      // }
      
    } catch (error) {
      console.error('Error starting download:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setDownloadStatus('error');
    }
  };

  // Poll for status updates
  const pollDownloadStatus = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/youtube/download-status/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to check download status');
      }
      
      const data = await response.json();
      setDownloadStatus(data.status);
      
      // Update progress (simulated for now)
      if (data.status === 'downloading') {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
        setTimeout(() => pollDownloadStatus(id), 1000);
      } else if (data.status === 'completed') {
        setDownloadProgress(100);
        toast({
          title: 'Download Complete',
          description: 'Your download is ready!',
        });
      } else if (data.status === 'failed') {
        setDownloadStatus('error');
        toast({
          title: 'Download Failed',
          description: 'There was an error downloading the video',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Error checking download status:', error);
      setDownloadStatus('error');
    }
  };

  // Download the file
  const downloadFile = async () => {
    if (!downloadId) return;
    
    try {
      window.open(
      `http://localhost:8001/api/youtube/download-file/${downloadId}`,
      '_blank'
    );
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    }
  };

  // Filter formats based on active tab
  let filteredFormats = videoInfo?.formats.filter(format => {
    if (activeTab === 'video') {
      return format.height > 0; // Video formats
    } else {
      return format.resolution === 'audio only'; // Audio-only formats
    }
  }) || [];

  const chooseFormat = async () => {
    filteredFormats = videoInfo?.formats.filter(format => {
      if (activeTab === 'video') {
        return format.height > 0; // Video formats
      } else {
        return format.resolution === 'audio only'; // Audio-only formats
      }
    }) || [];
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">YouTube Downloader</CardTitle>
          <CardDescription>
            Enter a YouTube URL to download videos in various formats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(fetchVideoInfo)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          {...field}
                          className="flex-1"
                        />
                      </FormControl>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            Loading
                          </>
                        ) : 'Get Info'}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Video Information */}
          {videoInfo && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Thumbnail */}
                <div className="md:w-1/3">
                  <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Video Details */}
                <div className="md:w-2/3 space-y-4">
                  <h3 className="text-xl font-semibold">{videoInfo.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Channel</p>
                      <p>{videoInfo.uploader}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p>{formatDuration(videoInfo.duration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Views</p>
                      <p>{videoInfo.view_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uploaded</p>
                      <p>{formatDate(videoInfo.upload_date)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Format Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Format</h3>
                
                <Tabs defaultValue="video" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger onClick={chooseFormat} value="video">Video</TabsTrigger>
                    <TabsTrigger value="audio">Audio Only</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="video" className="space-y-4">
                    <div className="mt-4">
                      <Select 
                        value={selectedFormat} 
                        onValueChange={setSelectedFormat}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a format" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredFormats.map(format => (
                            <SelectItem key={format.format_id} value={format.format_id}>
                              {format.height}p ({format.ext}) - {format.filesize > 0 ? formatBytes(format.filesize) : 'Unknown size'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-4">
                    <div className="mt-4">
                      <Select 
                        value={selectedFormat} 
                        onValueChange={setSelectedFormat}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an audio format" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredFormats.map(format => (
                            <SelectItem key={format.format_id} value={format.format_id}>
                              {format.format_note} ({format.ext}) - {format.filesize > 0 ? formatBytes(format.filesize) : 'Unknown size'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Download Section */}
              <div className="space-y-4">
                {downloadStatus === 'completed' ? (
                  <Button 
                    onClick={downloadFile} 
                    className="w-full" 
                    size="lg"
                  >
                    <FileVideo className="mr-2 h-5 w-5" />
                    Download File
                  </Button>
                ) : downloadStatus === 'downloading' || downloadStatus === 'starting' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Downloading...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-2" />
                  </div>
                ) : (
                  <Button 
                    onClick={startDownload} 
                    className="w-full" 
                    size="lg" 
                    disabled={!selectedFormat || isLoading}
                  >
                    <DownloadCloud className="mr-2 h-5 w-5" />
                    Download
                  </Button>
                )}
                
                {downloadStatus === 'error' && (
                  <p className="text-sm text-red-500 text-center">
                    There was an error with your download. Please try again.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to format date from YYYYMMDD format
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return 'Unknown date';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}