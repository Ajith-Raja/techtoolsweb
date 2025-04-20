import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Eye, 
  Star, 
  MoreVertical, 
  Download, 
  Loader2, 
  Trash2, 
  PenLine, 
  SlidersHorizontal, 
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SocialShare } from '@/components/SocialShare';
import { Link, useLocation } from 'wouter';

// Types for analysis history
interface AnalysisHistoryItem {
  id: number;
  userId: number;
  analysisType: string;
  targetUrl: string;
  favorite: boolean;
  notes: string | null;
  createdAt: string;
}

// Format analysis type for display
function formatAnalysisType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get badge color based on analysis type
function getAnalysisTypeBadge(type: string) {
  const colors: Record<string, string> = {
    'seo_analysis': 'bg-blue-100 text-blue-800',
    'plagiarism_check': 'bg-red-100 text-red-800',
    'content_gap': 'bg-green-100 text-green-800',
    'readability': 'bg-purple-100 text-purple-800',
    'keyword_density': 'bg-yellow-100 text-yellow-800',
    'domain_authority': 'bg-indigo-100 text-indigo-800',
    'pre_launch_audit': 'bg-pink-100 text-pink-800',
  };
  
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export default function AnalysisHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch analysis history for the current user
  const { data: analysisHistory, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/user/analysis-history'],
    queryFn: async () => {
      // For now we'll use mock data since the endpoint isn't implemented yet
      // In a real implementation, this would fetch from the API
      const mockData: AnalysisHistoryItem[] = [
        {
          id: 1,
          userId: 1,
          analysisType: 'seo_analysis',
          targetUrl: 'https://example.com',
          favorite: true,
          notes: 'Important analysis of our main website',
          createdAt: '2025-04-15T10:30:00Z'
        },
        {
          id: 2,
          userId: 1,
          analysisType: 'plagiarism_check',
          targetUrl: 'https://blog.example.com/article-1',
          favorite: false,
          notes: null,
          createdAt: '2025-04-10T14:20:00Z'
        },
        {
          id: 3,
          userId: 1,
          analysisType: 'content_gap',
          targetUrl: 'https://example.com',
          favorite: true,
          notes: 'Comparing against top 3 competitors',
          createdAt: '2025-04-05T09:15:00Z'
        },
        {
          id: 4,
          userId: 1,
          analysisType: 'readability',
          targetUrl: 'https://blog.example.com/article-2',
          favorite: false,
          notes: null,
          createdAt: '2025-04-01T16:45:00Z'
        },
        {
          id: 5,
          userId: 1,
          analysisType: 'keyword_density',
          targetUrl: 'https://example.com/services',
          favorite: false,
          notes: 'Check keyword optimization for services page',
          createdAt: '2025-03-28T11:10:00Z'
        }
      ];
      
      return mockData;
    },
    enabled: !!user, // Only run query if user is logged in
  });

  // Filtered history based on active tab and search filter
  const filteredHistory = React.useMemo(() => {
    if (!analysisHistory) return [];
    
    let filtered = analysisHistory;
    
    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'favorites') {
        filtered = filtered.filter(item => item.favorite);
      } else {
        filtered = filtered.filter(item => item.analysisType === activeTab);
      }
    }
    
    // Filter by search term
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = filtered.filter(item => 
        item.targetUrl.toLowerCase().includes(lowerFilter) || 
        (item.notes && item.notes.toLowerCase().includes(lowerFilter))
      );
    }
    
    return filtered;
  }, [analysisHistory, activeTab, filter]);

  // Toggle favorite status
  const toggleFavorite = (id: number) => {
    // In a real implementation, this would call an API endpoint
    toast({
      title: "Updated favorite status",
      description: "Your changes have been saved."
    });
  };

  // Delete analysis record
  const deleteAnalysis = (id: number) => {
    // In a real implementation, this would call an API endpoint
    toast({
      title: "Analysis deleted",
      description: "The analysis has been removed from your history."
    });
  };

  // Save notes
  const saveNotes = () => {
    if (!selectedItem) return;
    
    // In a real implementation, this would call an API endpoint
    toast({
      title: "Notes saved",
      description: "Your notes have been updated."
    });
    
    setNotesDialogOpen(false);
  };

  // View analysis details
  const viewAnalysis = (item: AnalysisHistoryItem) => {
    // In a real implementation, this would navigate to the appropriate results page
    const analysisTypeToRouteMap: Record<string, string> = {
      'seo_analysis': `/results?id=${item.id}`,
      'plagiarism_check': `/plagiarism-results?id=${item.id}`,
      'content_gap': `/content-gap-results?id=${item.id}`,
      'readability': `/readability-results?id=${item.id}`,
      'keyword_density': `/keyword-results?id=${item.id}`,
      'domain_authority': `/domain-authority-results?id=${item.id}`,
      'pre_launch_audit': `/audit-results?id=${item.id}`,
    };
    
    const route = analysisTypeToRouteMap[item.analysisType] || '/';
    setLocation(route);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Analysis History</CardTitle>
            <CardDescription>
              You need to be logged in to view your analysis history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-center mb-6">
              Please log in to access your saved analyses and history.
            </p>
            <Button asChild>
              <Link href="/auth">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Your Analysis History</CardTitle>
              <CardDescription>
                View and manage your previous analyses and saved reports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search analyses..."
                  className="pl-8 w-[200px] md:w-[250px]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 lg:w-[800px]">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="seo_analysis">SEO</TabsTrigger>
              <TabsTrigger value="plagiarism_check">Plagiarism</TabsTrigger>
              <TabsTrigger value="content_gap">Content Gap</TabsTrigger>
              <TabsTrigger value="readability">Readability</TabsTrigger>
              <TabsTrigger value="keyword_density">Keywords</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading your analysis history...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-20 text-red-500">
                <p>Error loading analysis history. Please try again later.</p>
                <Button className="mt-4" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  {filter 
                    ? "No matching analyses found. Try a different search term." 
                    : activeTab === 'all' 
                      ? "You haven't run any analyses yet." 
                      : activeTab === 'favorites' 
                        ? "You don't have any favorite analyses yet." 
                        : `You don't have any ${formatAnalysisType(activeTab)} analyses yet.`
                  }
                </p>
                <Button asChild>
                  <Link href="/">Run an Analysis</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-[150px]">Type</TableHead>
                    <TableHead className="w-[100px]">Notes</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="truncate max-w-[300px]">
                        {item.targetUrl}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getAnalysisTypeBadge(item.analysisType)}`}>
                          {formatAnalysisType(item.analysisType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.notes ? (
                          <Badge variant="outline" className="cursor-pointer" onClick={() => {
                            setSelectedItem(item);
                            setNotes(item.notes || '');
                            setNotesDialogOpen(true);
                          }}>
                            View Notes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="cursor-pointer opacity-50" onClick={() => {
                            setSelectedItem(item);
                            setNotes('');
                            setNotesDialogOpen(true);
                          }}>
                            Add Notes
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(item.id)}
                            className={item.favorite ? "text-yellow-500" : "text-muted-foreground"}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewAnalysis(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => viewAnalysis(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedItem(item);
                                setNotes(item.notes || '');
                                setNotesDialogOpen(true);
                              }}>
                                <PenLine className="h-4 w-4 mr-2" />
                                {item.notes ? 'Edit Notes' : 'Add Notes'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download Report
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteAnalysis(item.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.notes ? 'Edit Notes' : 'Add Notes'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `For ${formatAnalysisType(selectedItem.analysisType)} of ${selectedItem.targetUrl}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Add your notes about this analysis..."
              className="min-h-[150px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}