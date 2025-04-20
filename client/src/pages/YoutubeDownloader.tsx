import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Youtube, 
  Search, 
  Video, 
  Music, 
  Volume2, 
  Film, 
  FileVideo, 
  Copy, 
  Check, 
  ChevronRight 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoFormat {
  id: string;
  quality: string;
  format: 'mp4' | 'webm' | 'mp3' | 'ogg';
  type: 'video' | 'audio';
  size: string;
  resolution?: string;
  fps?: number;
  bitrate?: string;
}

interface VideoInfo {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  uploadDate: string;
  formats: VideoFormat[];
}

export default function YoutubeDownloader() {
  const [url, setUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadType, setDownloadType] = useState<'video' | 'audio'>('video');
  const { toast } = useToast();

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const fetchVideoInfo = async () => {
    if (!isValidYoutubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube video URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setVideoInfo(null);
    
    // Simulate API call to get video info
    setTimeout(() => {
      // Extract video ID from URL for thumbnail
      const videoId = extractVideoId(url);
      
      if (!videoId) {
        toast({
          title: "Invalid YouTube URL",
          description: "Could not extract video ID from the URL",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Simulate retrieved video info
      const mockVideoInfo: VideoInfo = {
        id: videoId,
        title: "Sample YouTube Video Title - Amazing Content 2025",
        author: "Content Creator",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: "10:15",
        viewCount: "1.2M",
        uploadDate: "2025-03-15",
        formats: [
          { id: '1', quality: '1080p', format: 'mp4', type: 'video', size: '210 MB', resolution: '1920x1080', fps: 30 },
          { id: '2', quality: '720p', format: 'mp4', type: 'video', size: '135 MB', resolution: '1280x720', fps: 30 },
          { id: '3', quality: '480p', format: 'mp4', type: 'video', size: '80 MB', resolution: '854x480', fps: 30 },
          { id: '4', quality: '360p', format: 'mp4', type: 'video', size: '45 MB', resolution: '640x360', fps: 30 },
          { id: '5', quality: '240p', format: 'mp4', type: 'video', size: '25 MB', resolution: '426x240', fps: 30 },
          { id: '6', quality: '144p', format: 'mp4', type: 'video', size: '15 MB', resolution: '256x144', fps: 30 },
          { id: '7', quality: 'High', format: 'mp3', type: 'audio', size: '10 MB', bitrate: '320 kbps' },
          { id: '8', quality: 'Medium', format: 'mp3', type: 'audio', size: '6 MB', bitrate: '192 kbps' },
          { id: '9', quality: 'Low', format: 'mp3', type: 'audio', size: '3 MB', bitrate: '128 kbps' },
        ],
      };
      
      setVideoInfo(mockVideoInfo);
      // Default selection to 720p for video, high quality for audio
      const defaultFormat = mockVideoInfo.formats.find(f => f.type === downloadType && 
        (downloadType === 'video' ? f.quality === '720p' : f.quality === 'High'));
      if (defaultFormat) {
        setSelectedFormat(defaultFormat);
      } else {
        setSelectedFormat(null);
      }
      setLoading(false);
    }, 1500);
  };

  const downloadVideo = () => {
    if (!videoInfo || !selectedFormat) return;
    
    setDownloading(true);
    setProgress(0);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10) + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setDownloading(false);
          toast({
            title: "Download Complete",
            description: `Your ${selectedFormat.type} has been successfully downloaded.`,
          });
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  const copyVideoUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTabChange = (value: string) => {
    setDownloadType(value as 'video' | 'audio');
    if (videoInfo) {
      // When changing tabs, select the default format for that type
      const defaultFormat = videoInfo.formats.find(f => 
        f.type === value && (value === 'video' ? f.quality === '720p' : f.quality === 'High')
      );
      if (defaultFormat) {
        setSelectedFormat(defaultFormat);
      } else {
        setSelectedFormat(null);
      }
    }
  };

  // Helper function to validate YouTube URL
  const isValidYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  // Helper function to extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Youtube className="h-6 w-6 mr-2 text-primary" />
            YouTube Video Downloader
          </CardTitle>
          <CardDescription>
            Download videos and audio from YouTube in various formats and qualities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="youtube-url">Enter YouTube Video URL</Label>
            <div className="flex space-x-2">
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={handleUrlChange}
                disabled={loading || downloading}
                className="flex-1"
              />
              <Button
                variant="default"
                onClick={fetchVideoInfo}
                disabled={!url || loading || downloading}
              >
                {loading ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Fetch Info
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copyVideoUrl}
                disabled={!url}
                title="Copy URL"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {videoInfo && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={videoInfo.thumbnailUrl} 
                      alt={videoInfo.title} 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // Fallback to SD thumbnail if HD is not available
                        const target = e.target as HTMLImageElement;
                        target.src = `https://img.youtube.com/vi/${videoInfo.id}/0.jpg`;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white px-2 py-1 text-xs rounded-tl-md">
                      {videoInfo.duration}
                    </div>
                  </div>
                </div>
                
                <div className="md:w-1/2 space-y-3">
                  <h3 className="text-lg font-semibold line-clamp-2">{videoInfo.title}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span className="font-medium">{videoInfo.author}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Views:</span>
                      <span>{videoInfo.viewCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Upload Date:</span>
                      <span>{videoInfo.uploadDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <Tabs defaultValue="video" value={downloadType} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="video" className="flex items-center">
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="flex items-center">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Audio
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="video" className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Select Video Quality</Label>
                      <RadioGroup 
                        value={selectedFormat?.id ?? ""} 
                        onValueChange={(value) => {
                          const format = videoInfo.formats.find(f => f.id === value && f.type === 'video');
                          if (format) {
                            setSelectedFormat(format);
                          }
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {videoInfo.formats
                            .filter(format => format.type === 'video')
                            .map(format => (
                              <div key={format.id} className={`flex items-center space-x-2 border rounded-md p-3 
                                ${selectedFormat?.id === format.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                              >
                                <RadioGroupItem value={format.id} id={`quality-${format.id}`} />
                                <Label htmlFor={`quality-${format.id}`} className="flex flex-1 justify-between cursor-pointer">
                                  <div className="flex items-center">
                                    <FileVideo className="h-4 w-4 mr-2 text-primary" />
                                    <span className="font-medium">{format.quality}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">{format.resolution}</div>
                                    <div className="text-xs">{format.size}</div>
                                  </div>
                                </Label>
                              </div>
                            ))
                          }
                        </div>
                      </RadioGroup>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="audio" className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Select Audio Quality</Label>
                      <RadioGroup 
                        value={selectedFormat?.id ?? ""} 
                        onValueChange={(value) => {
                          const format = videoInfo.formats.find(f => f.id === value && f.type === 'audio');
                          if (format) {
                            setSelectedFormat(format);
                          }
                        }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {videoInfo.formats
                            .filter(format => format.type === 'audio')
                            .map(format => (
                              <div key={format.id} className={`flex items-center space-x-2 border rounded-md p-3 
                                ${selectedFormat?.id === format.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                              >
                                <RadioGroupItem value={format.id} id={`quality-${format.id}`} />
                                <Label htmlFor={`quality-${format.id}`} className="flex flex-1 justify-between cursor-pointer">
                                  <div className="flex items-center">
                                    <Music className="h-4 w-4 mr-2 text-primary" />
                                    <span className="font-medium">{format.quality}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-muted-foreground">{format.bitrate}</div>
                                    <div className="text-xs">{format.size}</div>
                                  </div>
                                </Label>
                              </div>
                            ))
                          }
                        </div>
                      </RadioGroup>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {downloading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Downloading {selectedFormat?.type === 'video' ? 'video' : 'audio'}...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          {videoInfo && selectedFormat && !downloading && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={downloadVideo}
            >
              <Download className="mr-2 h-4 w-4" />
              Download {selectedFormat.type === 'video' ? `Video (${selectedFormat.quality})` : `Audio (${selectedFormat.quality})`}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}