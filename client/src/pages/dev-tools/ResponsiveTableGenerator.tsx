import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, Download, Copy, Upload, RefreshCw, FileUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface DataItem {
  [key: string]: string | number;
}

export default function ResponsiveTableGenerator() {
  const { toast } = useToast();
  const [data, setData] = useState<DataItem[]>([]);
  const [rawData, setRawData] = useState<string>("");
  const [columns, setColumns] = useState<ColumnDef<DataItem>[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [tableOptions, setTableOptions] = useState({
    showPagination: true,
    showSearch: true,
    enableSorting: true,
    showRowsPerPage: true,
    zebra: true,
    bordered: false,
    condensed: false,
    responsive: true,
  });
  const [tableStyle, setTableStyle] = useState({
    headerBgColor: "#f1f5f9",
    headerTextColor: "#334155", 
    rowBgColor: "#ffffff",
    rowTextColor: "#334155",
    zebraColor: "#f8fafc",
    borderColor: "#e2e8f0",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateColumns = useCallback((data: DataItem[]) => {
    if (!data.length) return [];
    
    // Get all unique keys from the data
    const keys = Array.from(
      new Set(data.flatMap(item => Object.keys(item)))
    );
    
    return keys.map(key => ({
      id: key,
      accessorFn: (row: DataItem) => row[key],
      header: ({ column }) => (
        <div 
          className="cursor-pointer select-none flex items-center" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {key}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </div>
      ),
      cell: info => info.getValue(),
    } as ColumnDef<DataItem>));
  }, []);
  
  const processData = useCallback((inputData: string) => {
    try {
      const result = Papa.parse<DataItem>(inputData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      
      if (result.data && result.data.length > 0) {
        setData(result.data);
        setColumns(generateColumns(result.data));
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${result.data.length} rows of data.`,
        });
      } else {
        toast({
          title: "Error parsing data",
          description: "No data rows could be processed. Please check the format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error processing data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [generateColumns, toast]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawData(content);
      processData(content);
    };
    reader.readAsText(file);
  };
  
  const handleTextInput = () => {
    if (rawData.trim()) {
      processData(rawData);
    } else {
      toast({
        title: "No data provided",
        description: "Please enter or paste some CSV data.",
        variant: "destructive",
      });
    }
  };
  
  const handleSampleData = () => {
    const sampleData = `Name,Age,City,Country,Occupation
John Doe,32,New York,USA,Engineer
Jane Smith,28,London,UK,Designer
Alex Johnson,45,Paris,France,Doctor
Samantha Brown,37,Toronto,Canada,Teacher
Michael Wilson,52,Sydney,Australia,Lawyer
Emily Davis,29,Berlin,Germany,Artist
Robert Miller,41,Tokyo,Japan,Manager
Lisa Garcia,33,Madrid,Spain,Chef
David Anderson,39,Rome,Italy,Architect
Sarah Martinez,31,Mexico City,Mexico,Writer`;
    
    setRawData(sampleData);
    processData(sampleData);
  };
  
  const resetTable = () => {
    setData([]);
    setColumns([]);
    setRawData("");
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting([]);
    setGlobalFilter("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      pagination,
      globalFilter,
    },
  });
  
  const generateCode = () => {
    const {
      showPagination,
      showSearch,
      enableSorting,
      zebra,
      bordered,
      condensed,
      responsive,
    } = tableOptions;
    
    const {
      headerBgColor,
      headerTextColor,
      rowBgColor,
      rowTextColor,
      zebraColor,
      borderColor,
    } = tableStyle;
    
    // Generate table header from columns
    const headers = columns.map(col => col.id as string);
    
    // Generate CSS
    const css = `
<style>
  .custom-table-container {
    ${responsive ? 'overflow-x: auto;' : ''}
    margin-bottom: 1rem;
  }
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    ${bordered ? `border: 1px solid ${borderColor};` : ''}
  }
  .custom-table th {
    background-color: ${headerBgColor};
    color: ${headerTextColor};
    ${condensed ? 'padding: 0.5rem;' : 'padding: 0.75rem;'}
    text-align: left;
    ${bordered ? `border: 1px solid ${borderColor};` : ''}
    ${enableSorting ? 'cursor: pointer;' : ''}
  }
  .custom-table td {
    background-color: ${rowBgColor};
    color: ${rowTextColor};
    ${condensed ? 'padding: 0.5rem;' : 'padding: 0.75rem;'}
    ${bordered ? `border: 1px solid ${borderColor};` : ''}
  }
  ${zebra ? `.custom-table tr:nth-child(even) td {
    background-color: ${zebraColor};
  }` : ''}
  .custom-table-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }
  .custom-table-search {
    margin-bottom: 1rem;
  }
  .custom-table-search input {
    padding: 0.5rem;
    width: 100%;
    max-width: 300px;
  }
  .custom-table-pagination button {
    padding: 0.5rem 1rem;
    background-color: ${headerBgColor};
    color: ${headerTextColor};
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 0.25rem;
  }
  .custom-table-pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .custom-table-pagination select {
    padding: 0.5rem;
  }
</style>`;

    // Generate HTML structure
    const tableHTML = `
<div class="custom-table-container">
  ${showSearch ? `
  <div class="custom-table-search">
    <input type="text" id="table-search" placeholder="Search..." />
  </div>` : ''}
  <table class="custom-table" id="data-table">
    <thead>
      <tr>
        ${headers.map(header => `<th data-sort="${header}">${header}</th>`).join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${data.slice(0, 10).map(row => `
      <tr>
        ${headers.map(header => `<td>${row[header] !== undefined ? row[header] : ''}</td>`).join('\n        ')}
      </tr>`).join('\n      ')}
    </tbody>
  </table>
  ${showPagination ? `
  <div class="custom-table-pagination">
    <div>
      <span>Showing <span id="table-start">1</span> to <span id="table-end">10</span> of <span id="table-total">${data.length}</span> entries</span>
    </div>
    <div>
      <button id="table-first">First</button>
      <button id="table-prev">Previous</button>
      <button id="table-next">Next</button>
      <button id="table-last">Last</button>
    </div>
  </div>` : ''}
</div>`;

    // Simple JavaScript for basic functionality
    const javascript = `
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('data-table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const totalRows = rows.length;
    
    // Variables for pagination
    const rowsPerPage = 10;
    let currentPage = 0;
    
    ${showSearch ? `
    // Search functionality
    const searchInput = document.getElementById('table-search');
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
      
      updatePagination();
    });` : ''}
    
    ${enableSorting ? `
    // Sorting functionality
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.sort;
        sortTable(column);
      });
    });
    
    function sortTable(column) {
      const sortDirection = headers[headers.length - 1].classList.contains('sort-asc') ? 'desc' : 'asc';
      
      headers.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      headers.forEach(h => {
        if (h.dataset.sort === column) {
          h.classList.add('sort-' + sortDirection);
        }
      });
      
      rows.sort((a, b) => {
        const aValue = a.querySelector(\`td:nth-child(\${Array.from(headers).findIndex(h => h.dataset.sort === column) + 1})\`).textContent;
        const bValue = b.querySelector(\`td:nth-child(\${Array.from(headers).findIndex(h => h.dataset.sort === column) + 1})\`).textContent;
        
        if (!isNaN(aValue) && !isNaN(bValue)) {
          return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
        }
        
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
      
      rows.forEach(row => {
        table.querySelector('tbody').appendChild(row);
      });
      
      updatePagination();
    }` : ''}
    
    ${showPagination ? `
    // Pagination functionality
    function showPage(page) {
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      
      rows.forEach((row, index) => {
        row.style.display = (index >= start && index < end) ? '' : 'none';
      });
      
      document.getElementById('table-start').textContent = start + 1;
      document.getElementById('table-end').textContent = Math.min(end, totalRows);
      document.getElementById('table-total').textContent = totalRows;
      
      document.getElementById('table-first').disabled = page === 0;
      document.getElementById('table-prev').disabled = page === 0;
      document.getElementById('table-next').disabled = (page + 1) * rowsPerPage >= totalRows;
      document.getElementById('table-last').disabled = (page + 1) * rowsPerPage >= totalRows;
      
      currentPage = page;
    }
    
    document.getElementById('table-first').addEventListener('click', () => showPage(0));
    document.getElementById('table-prev').addEventListener('click', () => showPage(Math.max(0, currentPage - 1)));
    document.getElementById('table-next').addEventListener('click', () => showPage(Math.min(Math.ceil(totalRows / rowsPerPage) - 1, currentPage + 1)));
    document.getElementById('table-last').addEventListener('click', () => showPage(Math.ceil(totalRows / rowsPerPage) - 1));
    
    function updatePagination() {
      const visibleRows = rows.filter(row => row.style.display !== 'none');
      const visibleTotal = visibleRows.length;
      
      document.getElementById('table-total').textContent = visibleTotal;
      
      showPage(0);
    }
    
    // Initialize pagination
    showPage(0);` : ''}
  });
</script>`;

    return css + tableHTML + javascript;
  };
  
  const copyToClipboard = () => {
    const code = generateCode();
    navigator.clipboard.writeText(code)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "HTML table code has been copied to your clipboard.",
        });
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard: " + err,
          variant: "destructive",
        });
      });
  };
  
  const downloadHTML = () => {
    const code = generateCode();
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "responsive-table.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Responsive Table Generator</h1>
      <p className="text-gray-600 mb-8">
        Create beautiful, responsive HTML tables from your data. Upload a CSV file or paste your data, then customize the table appearance and export it for use in your website.
      </p>
      
      {/* Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>1. Input Data</CardTitle>
          <CardDescription>
            Upload a CSV file, paste data, or use sample data to create your table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="paste">Paste Data</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="paste">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Paste your CSV data here (comma separated values)"
                  className="min-h-[200px] font-mono text-sm"
                  value={rawData}
                  onChange={e => setRawData(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleTextInput} className="flex items-center">
                    Process Data <RefreshCw className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleSampleData} className="flex items-center">
                    Use Sample Data
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="upload">
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file-upload">CSV File</Label>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Accepts .csv files. First row should contain column headers.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Preview Table */}
      {data.length > 0 && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. Table Preview</CardTitle>
              <CardDescription>
                Preview your table and customize its appearance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="customize">Customize</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview">
                  <div className="space-y-4">
                    {tableOptions.showSearch && (
                      <div className="flex items-center">
                        <Input
                          placeholder="Search all columns..."
                          value={globalFilter ?? ''}
                          onChange={(e) => setGlobalFilter(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                    )}
                    
                    <div 
                      className={`rounded-md border ${tableOptions.responsive ? 'overflow-x-auto' : ''}`} 
                      style={{ borderColor: tableStyle.borderColor }}
                    >
                      <Table>
                        <TableHeader style={{ backgroundColor: tableStyle.headerBgColor, color: tableStyle.headerTextColor }}>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} style={{ color: tableStyle.headerTextColor }}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                </TableHead>
                              ))}
                            </TableRow>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, rowIndex) => (
                              <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                style={{ 
                                  backgroundColor: tableOptions.zebra && rowIndex % 2 !== 0 
                                    ? tableStyle.zebraColor 
                                    : tableStyle.rowBgColor,
                                  color: tableStyle.rowTextColor,
                                }}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell 
                                    key={cell.id}
                                    style={{ 
                                      borderColor: tableOptions.bordered ? tableStyle.borderColor : 'transparent',
                                      padding: tableOptions.condensed ? '0.5rem' : undefined,
                                    }}
                                  >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {tableOptions.showPagination && (
                      <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                          {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                          )}{" "}
                          of {table.getFilteredRowModel().rows.length} entries
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {tableOptions.showRowsPerPage && (
                            <Select
                              value={`${table.getState().pagination.pageSize}`}
                              onValueChange={(value) => {
                                table.setPageSize(Number(value))
                              }}
                            >
                              <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                              </SelectTrigger>
                              <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                  <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                          >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="customize">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Features</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-pagination"
                            checked={tableOptions.showPagination} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, showPagination: checked === true})
                            }
                          />
                          <Label htmlFor="show-pagination">Show Pagination</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-search"
                            checked={tableOptions.showSearch} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, showSearch: checked === true})
                            }
                          />
                          <Label htmlFor="show-search">Show Search</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="enable-sorting"
                            checked={tableOptions.enableSorting} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, enableSorting: checked === true})
                            }
                          />
                          <Label htmlFor="enable-sorting">Enable Sorting</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="show-rows-per-page"
                            checked={tableOptions.showRowsPerPage} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, showRowsPerPage: checked === true})
                            }
                          />
                          <Label htmlFor="show-rows-per-page">Show Rows Per Page Selector</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="zebra"
                            checked={tableOptions.zebra} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, zebra: checked === true})
                            }
                          />
                          <Label htmlFor="zebra">Zebra Striping</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bordered"
                            checked={tableOptions.bordered} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, bordered: checked === true})
                            }
                          />
                          <Label htmlFor="bordered">Bordered Cells</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="condensed"
                            checked={tableOptions.condensed} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, condensed: checked === true})
                            }
                          />
                          <Label htmlFor="condensed">Condensed (Smaller Padding)</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="responsive"
                            checked={tableOptions.responsive} 
                            onCheckedChange={(checked) => 
                              setTableOptions({...tableOptions, responsive: checked === true})
                            }
                          />
                          <Label htmlFor="responsive">Responsive (Horizontal Scroll)</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Colors</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="header-bg">Header Background</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="header-bg"
                                type="color" 
                                value={tableStyle.headerBgColor}
                                onChange={(e) => setTableStyle({...tableStyle, headerBgColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.headerBgColor}
                                onChange={(e) => setTableStyle({...tableStyle, headerBgColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="header-text">Header Text</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="header-text"
                                type="color" 
                                value={tableStyle.headerTextColor}
                                onChange={(e) => setTableStyle({...tableStyle, headerTextColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.headerTextColor}
                                onChange={(e) => setTableStyle({...tableStyle, headerTextColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="row-bg">Row Background</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="row-bg"
                                type="color" 
                                value={tableStyle.rowBgColor}
                                onChange={(e) => setTableStyle({...tableStyle, rowBgColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.rowBgColor}
                                onChange={(e) => setTableStyle({...tableStyle, rowBgColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="row-text">Row Text</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="row-text"
                                type="color" 
                                value={tableStyle.rowTextColor}
                                onChange={(e) => setTableStyle({...tableStyle, rowTextColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.rowTextColor}
                                onChange={(e) => setTableStyle({...tableStyle, rowTextColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="zebra-color">Zebra Stripe Color</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="zebra-color"
                                type="color" 
                                value={tableStyle.zebraColor}
                                onChange={(e) => setTableStyle({...tableStyle, zebraColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.zebraColor}
                                onChange={(e) => setTableStyle({...tableStyle, zebraColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="border-color">Border Color</Label>
                            <div className="flex mt-1">
                              <Input 
                                id="border-color"
                                type="color" 
                                value={tableStyle.borderColor}
                                onChange={(e) => setTableStyle({...tableStyle, borderColor: e.target.value})}
                                className="w-12 h-8 p-0 mr-2"
                              />
                              <Input 
                                type="text" 
                                value={tableStyle.borderColor}
                                onChange={(e) => setTableStyle({...tableStyle, borderColor: e.target.value})}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetTable}>
                Reset Table
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={copyToClipboard} className="flex items-center">
                  <Copy className="mr-2 h-4 w-4" /> Copy Code
                </Button>
                <Button onClick={downloadHTML} className="flex items-center">
                  <Download className="mr-2 h-4 w-4" /> Download HTML
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Code Section */}
          <Card>
            <CardHeader>
              <CardTitle>3. Generated Code</CardTitle>
              <CardDescription>
                This HTML and CSS code will create a responsive table that you can embed in your website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-auto max-h-[400px]">
                <pre className="text-sm font-mono">
                  {generateCode()}
                </pre>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex items-center">
                <Copy className="mr-2 h-4 w-4" /> Copy Code
              </Button>
              <Button onClick={downloadHTML} className="flex items-center">
                <Download className="mr-2 h-4 w-4" /> Download HTML
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}