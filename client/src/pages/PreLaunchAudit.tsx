import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle, Download, FileText, Search, Settings } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { apiRequest } from '@/lib/queryClient';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';

// Define the structure of our audit configuration
interface AuditConfig {
  url: string;
  sitemapUrl?: string;
  maxPages: number;
  userAgent: string;
  authUsername?: string;
  authPassword?: string;
  requiresAuth: boolean;
}

// Define the structure of issues found during the audit
interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedPages?: string[];
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Structure for page-specific audit results
interface PageAudit {
  url: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  wordCount: number;
  statusCode: number;
  loadTime: number;
  mobileResponsive: boolean;
  issues: AuditIssue[];
}

// Overall audit results structure
interface AuditResult {
  siteScore: number;
  totalPages: number;
  pagesWithIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  commonIssues: AuditIssue[];
  pageResults: PageAudit[];
  crawlDate: string;
}

export default function PreLaunchAudit() {
  // State for the audit configuration
  const [config, setConfig] = useState<AuditConfig>({
    url: '',
    sitemapUrl: '',
    maxPages: 50,
    userAgent: 'googlebot',
    requiresAuth: false,
  });

  // State for the audit results
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState('config');

  // Handle configuration changes
  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value,
    });
  };

  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: parseInt(value) || 0,
    });
  };

  // Handle checkbox/switch changes
  const handleToggleChange = (name: string, checked: boolean) => {
    setConfig({
      ...config,
      [name]: checked,
    });
  };

  // Use React Query for the audit request
  const auditMutation = useMutation({
    mutationFn: async (auditConfig: AuditConfig) => {
      // In a real implementation, this would call your backend API
      const response = await apiRequest(
        'POST',
        '/api/pre-launch-audit', 
        auditConfig
      );
      const data = await response.json();
      return data as AuditResult;
    },
    onSuccess: (data: AuditResult) => {
      setAuditResult(data);
      setActiveTab('results');
      toast({
        title: 'Audit completed successfully',
        description: `We found ${data.pagesWithIssues} pages with issues out of ${data.totalPages} pages.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Audit failed',
        description: 'There was an error running the audit. Please try again.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // Start the audit
  const handleStartAudit = () => {
    if (!config.url) {
      toast({
        title: 'Missing URL',
        description: 'Please enter a website URL to audit.',
        variant: 'destructive',
      });
      return;
    }

    auditMutation.mutate(config);
  };

  // Generate and download a PDF report
  const handleExportPDF = () => {
    if (!auditResult) return;

    const doc = new jsPDF();
    let y = 20;
    
    // Add title
    doc.setFontSize(20);
    doc.text('Pre-Launch SEO Audit Report', 105, y, { align: 'center' });
    y += 15;
    
    // Add URL and date
    doc.setFontSize(12);
    doc.text(`Website: ${config.url}`, 20, y);
    y += 10;
    doc.text(`Audit Date: ${auditResult.crawlDate}`, 20, y);
    y += 10;
    
    // Add summary
    doc.setFontSize(16);
    doc.text('Summary', 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.text(`SEO Score: ${auditResult.siteScore}/100`, 30, y);
    y += 7;
    doc.text(`Total Pages Scanned: ${auditResult.totalPages}`, 30, y);
    y += 7;
    doc.text(`Pages with Issues: ${auditResult.pagesWithIssues}`, 30, y);
    y += 7;
    doc.text(`Critical Issues: ${auditResult.criticalIssues}`, 30, y);
    y += 7;
    doc.text(`Warnings: ${auditResult.warningIssues}`, 30, y);
    y += 7;
    doc.text(`Informational: ${auditResult.infoIssues}`, 30, y);
    y += 15;
    
    // Add common issues
    doc.setFontSize(16);
    doc.text('Common Issues', 20, y);
    y += 10;
    
    auditResult.commonIssues.forEach((issue, index) => {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${issue.title} (${issue.impact} impact)`, 30, y);
      y += 7;
      
      doc.setFontSize(10);
      // Split long descriptions into multiple lines
      const descLines = doc.splitTextToSize(issue.description, 150);
      doc.text(descLines, 35, y);
      y += descLines.length * 5 + 5;
      
      const recLines = doc.splitTextToSize(`Recommendation: ${issue.recommendation}`, 150);
      doc.text(recLines, 35, y);
      y += recLines.length * 5 + 10;
    });
    
    // Save the PDF
    doc.save(`seo-audit-${config.url.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
    
    toast({
      title: 'Report exported',
      description: 'Your PDF report has been downloaded.',
    });
  };

  // Export results as CSV
  const handleExportCSV = () => {
    if (!auditResult) return;
    
    // Create CSV header
    let csv = 'URL,Title,Meta Description,H1 Count,Word Count,Status Code,Load Time,Mobile Responsive,Issues\n';
    
    // Add page data
    auditResult.pageResults.forEach(page => {
      const issueCount = page.issues.length;
      const row = [
        `"${page.url}"`,
        `"${page.title.replace(/"/g, '""')}"`,
        `"${page.metaDescription.replace(/"/g, '""')}"`,
        page.h1Count,
        page.wordCount,
        page.statusCode,
        page.loadTime,
        page.mobileResponsive ? 'Yes' : 'No',
        issueCount
      ];
      csv += row.join(',') + '\n';
    });
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seo-audit-${config.url.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'CSV exported',
      description: 'Your CSV report has been downloaded.',
    });
  };

  // For demonstration purposes, let's create a mock audit result
  const runMockAudit = () => {
    // This would be replaced with the real API call in production
    const mockResult: AuditResult = {
      siteScore: 78,
      totalPages: 25,
      pagesWithIssues: 12,
      criticalIssues: 3,
      warningIssues: 8,
      infoIssues: 6,
      crawlDate: new Date().toISOString(),
      commonIssues: [
        {
          type: 'error',
          title: 'Missing Meta Descriptions',
          description: '5 pages are missing meta descriptions, which are essential for search engines to understand page content and display in search results.',
          impact: 'high',
          recommendation: 'Add unique, descriptive meta descriptions to each page between 120-158 characters.'
        },
        {
          type: 'error',
          title: 'Slow Page Loading Speed',
          description: '3 pages take more than 3 seconds to load, which can negatively impact user experience and search rankings.',
          impact: 'high',
          recommendation: 'Optimize images, enable browser caching, and minimize CSS/JavaScript to improve loading times.'
        },
        {
          type: 'warning',
          title: 'Multiple H1 Tags',
          description: '4 pages have multiple H1 tags, which can confuse search engines about the main topic of the page.',
          impact: 'medium',
          recommendation: 'Ensure each page has exactly one H1 tag that clearly describes the page content.'
        },
        {
          type: 'warning',
          title: 'Low Word Count',
          description: '6 pages have less than 300 words, which may be considered thin content by search engines.',
          impact: 'medium',
          recommendation: 'Expand content to provide more value and cover topics comprehensively.'
        },
        {
          type: 'info',
          title: 'Missing Alt Text for Images',
          description: 'Several images across the site are missing alt text, which helps with accessibility and image search.',
          impact: 'low',
          recommendation: 'Add descriptive alt text to all images that conveys their purpose or content.'
        }
      ],
      pageResults: Array(25).fill(0).map((_, i) => ({
        url: `${config.url}/page-${i + 1}`,
        title: `Example Page ${i + 1} | ${config.url}`,
        metaDescription: i % 5 === 0 ? '' : `This is an example meta description for page ${i + 1}.`,
        h1Count: i % 4 === 0 ? 2 : 1,
        wordCount: 200 + (i * 50),
        statusCode: i === 2 ? 404 : 200,
        loadTime: i % 7 === 0 ? 3.5 : 1.2,
        mobileResponsive: i !== 3,
        issues: [
          ...(i % 5 === 0 ? [{
            type: 'error',
            title: 'Missing Meta Description',
            description: 'This page is missing a meta description.',
            impact: 'high',
            recommendation: 'Add a unique, descriptive meta description between 120-158 characters.'
          }] : []),
          ...(i % 7 === 0 ? [{
            type: 'error',
            title: 'Slow Loading Speed',
            description: 'This page takes too long to load (over 3 seconds).',
            impact: 'high',
            recommendation: 'Optimize images and minimize CSS/JavaScript.'
          }] : []),
          ...(i % 4 === 0 ? [{
            type: 'warning',
            title: 'Multiple H1 Tags',
            description: 'This page has multiple H1 tags.',
            impact: 'medium',
            recommendation: 'Ensure the page has exactly one H1 tag.'
          }] : []),
          ...(i < 6 ? [{
            type: 'warning',
            title: 'Low Word Count',
            description: 'This page has less than 300 words of content.',
            impact: 'medium',
            recommendation: 'Add more quality content to this page.'
          }] : []),
          ...(i % 3 === 0 ? [{
            type: 'info',
            title: 'Missing Alt Text',
            description: 'Some images on this page are missing alt text.',
            impact: 'low',
            recommendation: 'Add descriptive alt text to all images.'
          }] : [])
        ].filter(Boolean) as AuditIssue[]
      }))
    };

    setAuditResult(mockResult);
    setActiveTab('results');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Pre-Launch SEO Audit Tool</CardTitle>
          <CardDescription>
            Comprehensive SEO analysis before launching your website. Check for common issues and get actionable recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="results" disabled={!auditResult}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="config" className="space-y-6 pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">Website URL <span className="text-red-500">*</span></Label>
                  <Input 
                    id="url" 
                    name="url"
                    placeholder="https://example.com" 
                    value={config.url}
                    onChange={handleConfigChange}
                  />
                  <p className="text-sm text-gray-500">
                    Enter the root domain of the website you want to audit
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="sitemapUrl">Sitemap URL (Optional)</Label>
                  <Input 
                    id="sitemapUrl" 
                    name="sitemapUrl"
                    placeholder="https://example.com/sitemap.xml" 
                    value={config.sitemapUrl || ''}
                    onChange={handleConfigChange}
                  />
                  <p className="text-sm text-gray-500">
                    Providing a sitemap URL allows for more efficient crawling
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxPages">Maximum Pages to Scan</Label>
                    <Input 
                      id="maxPages" 
                      name="maxPages"
                      type="number"
                      min={1}
                      max={500}
                      value={config.maxPages}
                      onChange={handleNumberChange}
                    />
                    <p className="text-sm text-gray-500">
                      Limit the number of pages to audit (1-500)
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="userAgent">User Agent</Label>
                    <Input 
                      id="userAgent" 
                      name="userAgent"
                      value={config.userAgent}
                      onChange={handleConfigChange}
                      placeholder="Googlebot"
                    />
                    <p className="text-sm text-gray-500">
                      Defaults to Googlebot, or specify a custom user agent
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-2 pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="requiresAuth" 
                      checked={config.requiresAuth}
                      onCheckedChange={(checked) => handleToggleChange('requiresAuth', checked)}
                    />
                    <Label htmlFor="requiresAuth">Requires Authentication</Label>
                  </div>
                  <p className="text-sm text-gray-500 pl-7">
                    Toggle if the website requires authentication to access
                  </p>
                </div>
                
                {config.requiresAuth && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                    <div className="grid gap-2">
                      <Label htmlFor="authUsername">Username</Label>
                      <Input 
                        id="authUsername" 
                        name="authUsername"
                        value={config.authUsername || ''}
                        onChange={handleConfigChange}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="authPassword">Password</Label>
                      <Input 
                        id="authPassword" 
                        name="authPassword"
                        type="password"
                        value={config.authPassword || ''}
                        onChange={handleConfigChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-6 pt-4">
              {auditResult && (
                <div className="space-y-8">
                  {/* Summary Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-4">Audit Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Overall SEO Score</div>
                        <div className="flex items-center mt-1 space-x-1">
                          <span className="text-3xl font-bold">{auditResult.siteScore}</span>
                          <span className="text-lg">/100</span>
                        </div>
                        <Progress 
                          value={auditResult.siteScore} 
                          className={cn("h-2 mt-2", 
                            auditResult.siteScore >= 80 ? "bg-green-100" :
                            auditResult.siteScore >= 60 ? "bg-yellow-100" : 
                            "bg-red-100"
                          )}
                        >
                          <div 
                            className={cn("h-full transition-all", 
                              auditResult.siteScore >= 80 ? "bg-green-500" :
                              auditResult.siteScore >= 60 ? "bg-yellow-500" : 
                              "bg-red-500"
                            )}
                            style={{ width: `${auditResult.siteScore}%` }}
                          />
                        </Progress>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Pages Scanned</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-3xl font-bold">{auditResult.totalPages}</span>
                          <FileText className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="text-sm mt-2 text-gray-500 dark:text-gray-400">
                          {auditResult.pagesWithIssues} pages with issues
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Issues Found</div>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            <span className="text-xl font-bold text-red-500">{auditResult.criticalIssues}</span>
                            <div className="text-xs text-gray-500">Critical</div>
                          </div>
                          <div>
                            <span className="text-xl font-bold text-yellow-500">{auditResult.warningIssues}</span>
                            <div className="text-xs text-gray-500">Warnings</div>
                          </div>
                          <div>
                            <span className="text-xl font-bold text-blue-500">{auditResult.infoIssues}</span>
                            <div className="text-xs text-gray-500">Info</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Common Issues Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Common Issues</h3>
                    
                    <div className="space-y-4">
                      {auditResult.commonIssues.map((issue, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-md p-4 ${
                            issue.type === 'error' ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 
                            issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800' : 
                            'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="mr-3 mt-0.5">
                              {issue.type === 'error' ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : issue.type === 'warning' ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-base">{issue.title}</h4>
                                <Badge variant={
                                  issue.impact === 'high' ? 'destructive' : 
                                  issue.impact === 'medium' ? 'default' : 
                                  'secondary'
                                }>
                                  {issue.impact} impact
                                </Badge>
                              </div>
                              <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{issue.description}</p>
                              <div className="mt-3">
                                <p className="text-sm font-medium">Recommendation:</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{issue.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Page Results Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Page Results</h3>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {auditResult.pageResults.map((page, index) => (
                        <AccordionItem key={index} value={`page-${index}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex justify-between w-full pr-4 items-center">
                              <div className="text-left">
                                <div className="font-medium truncate max-w-[300px] md:max-w-[500px]">
                                  {page.url.replace(config.url, '')}
                                </div>
                                <div className="text-sm text-gray-500 truncate max-w-[300px] md:max-w-[500px]">
                                  {page.title}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {page.issues.length > 0 ? (
                                  <Badge variant="outline" className="ml-auto">
                                    {page.issues.length} issues
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    No issues
                                  </Badge>
                                )}
                                {page.statusCode !== 200 && (
                                  <Badge variant="destructive">
                                    {page.statusCode}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-4 pb-2 space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-sm font-medium">Status Code</div>
                                  <div className={`text-base ${page.statusCode !== 200 ? 'text-red-500' : 'text-green-500'}`}>
                                    {page.statusCode}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium">H1 Tags</div>
                                  <div className={`text-base ${page.h1Count !== 1 ? 'text-yellow-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {page.h1Count}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Word Count</div>
                                  <div className={`text-base ${page.wordCount < 300 ? 'text-yellow-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {page.wordCount}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm font-medium">Load Time</div>
                                  <div className={`text-base ${page.loadTime > 3 ? 'text-red-500' : page.loadTime > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {page.loadTime}s
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm font-medium">Meta Description</div>
                                <div className={`text-sm mt-1 ${!page.metaDescription ? 'text-red-500 italic' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {page.metaDescription || "Missing meta description"}
                                </div>
                              </div>
                              
                              {page.issues.length > 0 && (
                                <div>
                                  <div className="text-sm font-medium mb-2">Issues Found</div>
                                  <div className="space-y-3">
                                    {page.issues.map((issue, i) => (
                                      <div key={i} className="flex items-start">
                                        <div className="mr-2 mt-0.5">
                                          {issue.type === 'error' ? (
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                          ) : issue.type === 'warning' ? (
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                          ) : (
                                            <CheckCircle className="h-4 w-4 text-blue-500" />
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">{issue.title}</div>
                                          <div className="text-xs text-gray-600 dark:text-gray-400">{issue.description}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {activeTab === 'results' && auditResult && (
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
          <div>
            {activeTab === 'config' && (
              <Button onClick={() => runMockAudit()} disabled={auditMutation.isPending || !config.url}>
                <Search className="mr-2 h-4 w-4" />
                {auditMutation.isPending ? 'Auditing...' : 'Start Audit'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}