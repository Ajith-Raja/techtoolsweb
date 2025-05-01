import {
  Menu,
  Search,
  BarChart,
  BarChart3,
  BookOpen,
  FileQuestion,
  Activity,
  TrendingUp,
  Home as HomeIcon,
  ChevronDown,
  Gauge,
  Book,
  Percent,
  Type,
  Image,
  Languages,
  CheckSquare,
  User,
  LogOut,
  Loader2,
  GitCompare,
  LineChart,
  History,
  Settings,
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
  Youtube,
  Calculator,
  DollarSign,
  ArrowLeftRight,
  QrCode,
  Receipt,
  PiggyBank,
  Clock, 
  Calendar,
  FileImage,
  Timer,
  Table,
  Map,
  Webhook,
  KeyIcon,
  Hash,
  ShieldCheck,
  Terminal,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  premium?: boolean;
}

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation, isLoading } = useAuth();

  const mainNavigation: NavItem[] = [
  ];

  const toolsNavigation: NavItem[] = [
    {
      name: "Plagiarism Checker",
      href: "/plagiarism",
      icon: <FileQuestion className="mr-2 h-4 w-4" />,
    },
    {
      name: "Schema Generator",
      href: "/schema",
      icon: <Activity className="mr-2 h-4 w-4" />,
    },
    {
      name: "Domain Age Checker",
      href: "/domain-age",
      icon: <Search className="mr-2 h-4 w-4" />,
    },
    {
      name: "Domain Authority",
      href: "/domain-authority",
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
    },
    {
      name: "Readability Checker",
      href: "/readability",
      icon: <Book className="mr-2 h-4 w-4" />,
    },
    {
      name: "Keyword Density",
      href: "/keyword-density",
      icon: <Percent className="mr-2 h-4 w-4" />,
    },
    {
      name: "Font Generator",
      href: "/font-generator",
      icon: <Type className="mr-2 h-4 w-4" />,
    },
    {
      name: "Image Compressor",
      href: "/image-compressor",
      icon: <Image className="mr-2 h-4 w-4" />,
    },
    {
      name: "Pre-Launch Audit",
      href: "/pre-launch-audit",
      icon: <CheckSquare className="mr-2 h-4 w-4" />,
      premium: true,
    },
    {
      name: "Content Gap Analyzer",
      href: "/content-gap-analyzer",
      icon: <LineChart className="mr-2 h-4 w-4" />,
      premium: true,
    },
  ];
  
  const calculatorsNavigation: NavItem[] = [
    {
      name: "Percentage Calculator",
      href: "/calculators/percentage",
      icon: <Percent className="mr-2 h-4 w-4" />,
    },
    {
      name: "EMI Calculator",
      href: "/calculators/emi",
      icon: <DollarSign className="mr-2 h-4 w-4" />,
    },
    {
      name: "GST Calculator",
      href: "/calculators/gst",
      icon: <Calculator className="mr-2 h-4 w-4" />,
    },
    {
      name: "Unit Converter",
      href: "/calculators/unit-converter",
      icon: <ArrowLeftRight className="mr-2 h-4 w-4" />,
    },
    {
      name: "SIP Calculator",
      href: "/calculators/sip",
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
    },
    {
      name: "Retirement Calculator",
      href: "/calculators/retirement",
      icon: <PiggyBank className="mr-2 h-4 w-4" />,
    },
    {
      name: "Investment Calculator",
      href: "/calculators/investment",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
    },
    {
      name: "Income Tax Calculator",
      href: "/calculators/income-tax",
      icon: <Receipt className="mr-2 h-4 w-4" />,
    },
    {
      name: "Timezone Converter",
      href: "/calculators/timezone-converter",
      icon: <Clock className="mr-2 h-4 w-4" />,
    },
    {
      name: "Unix Timestamp Converter",
      href: "/calculators/unix-timestamp-converter",
      icon: <Timer className="mr-2 h-4 w-4" />,
    },
    {
      name: "Birthday Calculator",
      href: "/calculators/birthday-calculator",
      icon: <Calendar className="mr-2 h-4 w-4" />,
    },
  ];
  
  const otherToolsNavigation: NavItem[] = [
    {
      name: "QR Code Generator",
      href: "/qr-code-generator",
      icon: <QrCode className="mr-2 h-4 w-4" />,
    },
    {
      name: "Diff Checker",
      href: "/diff-checker",
      icon: <GitCompare className="mr-2 h-4 w-4" />,
    },
    {
      name: "Transliterate",
      href: "/transliterate",
      icon: <Languages className="mr-2 h-4 w-4" />,
    },
    {
      name: "API Tester",
      href: "/api-tester",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
    {
      name: "YouTube Downloader",
      href: "/youtube-downloader",
      icon: <Youtube className="mr-2 h-4 w-4" />,
    },
    {
      name: "Regex Tester",
      href: "/regex-tester",
      icon: <FileText className="mr-2 h-4 w-4" />,
    },
    {
      name: "Image to SVG Converter",
      href: "/image-to-svg",
      icon: <FileImage className="mr-2 h-4 w-4" />,
    },
    {
      name: "Calendar Generator",
      href: "/calendar-generator",
      icon: <Calendar className="mr-2 h-4 w-4" />,
    }
  ];

  const developerToolsNavigation: NavItem[] = [
    {
      name: "Responsive Table Generator",
      href: "/dev-tools/table-generator",
      icon: <Table className="mr-2 h-4 w-4" />,
    },
    {
      name: "Sitemap Visualizer",
      href: "/dev-tools/sitemap-visualizer",
      icon: <Map className="mr-2 h-4 w-4" />,
    },
    {
      name: "Webhook Simulator",
      href: "/dev-tools/webhook-simulator",
      icon: <Webhook className="mr-2 h-4 w-4" />,
    },
    {
      name: "JWT Decoder",
      href: "/dev-tools/jwt-decoder",
      icon: <KeyIcon className="mr-2 h-4 w-4" />,
    },
    {
      name: "Hash Generator",
      href: "/dev-tools/hash-generator",
      icon: <Hash className="mr-2 h-4 w-4" />,
    },
    {
      name: "Password Strength Tester",
      href: "/dev-tools/password-strength",
      icon: <ShieldCheck className="mr-2 h-4 w-4" />,
    },
    {
      name: "Cron Time Generator",
      href: "/dev-tools/cron-generator",
      icon: <Terminal className="mr-2 h-4 w-4" />,
    },
  ];
  
  const pdfToolsNavigation: NavItem[] = [
    {
      name: "Compress PDF",
      href: "/pdf-tools/compress",
      icon: <FileText className="mr-2 h-4 w-4" />,
    },
    {
      name: "PDF to Word",
      href: "/pdf-tools/pdf-to-word",
      icon: <FileOutput className="mr-2 h-4 w-4" />,
    },
    {
      name: "PDF to Image",
      href: "/pdf-tools/pdf-to-image",
      icon: <FileOutput className="mr-2 h-4 w-4" />,
    },
    {
      name: "Word to PDF",
      href: "/pdf-tools/word-to-pdf",
      icon: <FileInput className="mr-2 h-4 w-4" />,
    },
    {
      name: "Extract Text",
      href: "/pdf-tools/extract-text",
      icon: <FileText className="mr-2 h-4 w-4" />,
    },
    {
      name: "Extract Images",
      href: "/pdf-tools/extract-images",
      icon: <Image className="mr-2 h-4 w-4" />,
    },
    {
      name: "Merge PDFs",
      href: "/pdf-tools/merge",
      icon: <FileStack className="mr-2 h-4 w-4" />,
    },
    {
      name: "Split PDF",
      href: "/pdf-tools/split",
      icon: <ScissorsSquare className="mr-2 h-4 w-4" />,
    },
    {
      name: "Reorder Pages",
      href: "/pdf-tools/reorder",
      icon: <FilePlus className="mr-2 h-4 w-4" />,
    },
    {
      name: "Rotate PDF",
      href: "/pdf-tools/rotate",
      icon: <RotateCw className="mr-2 h-4 w-4" />,
    },
    {
      name: "Protect PDF",
      href: "/pdf-tools/protect",
      icon: <FileLock className="mr-2 h-4 w-4" />,
    },
    {
      name: "Unlock PDF",
      href: "/pdf-tools/unlock",
      icon: <Unlock className="mr-2 h-4 w-4" />,
    },
    {
      name: "Add Watermark",
      href: "/pdf-tools/watermark",
      icon: <Stamp className="mr-2 h-4 w-4" />,
    },
    {
      name: "Edit Metadata",
      href: "/pdf-tools/metadata",
      icon: <FileSignature className="mr-2 h-4 w-4" />,
    },
    {
      name: "Remove Pages",
      href: "/pdf-tools/remove-pages",
      icon: <ScissorsSquare className="mr-2 h-4 w-4" />,
    },
  ];

  // Combined navigation for mobile view
  const allNavigation: NavItem[] = [
    ...mainNavigation, 
    ...toolsNavigation,
    ...calculatorsNavigation,
    ...otherToolsNavigation,
    ...pdfToolsNavigation,
    ...developerToolsNavigation
  ];

  const isActive = (path: string) => location === path;
  const isToolActive = () =>
    toolsNavigation.some((item) => location === item.href);
  const isPdfToolActive = () =>
    pdfToolsNavigation.some((item) => location === item.href);
  const isCalculatorActive = () =>
    calculatorsNavigation.some((item) => location === item.href);
  const isOtherToolActive = () =>
    otherToolsNavigation.some((item) => location === item.href);
  const isDeveloperToolActive = () =>
    developerToolsNavigation.some((item) => location === item.href);

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <a href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">
                SEO Analyzer
              </span>
            </a>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Main navigation items */}
              {mainNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-200",
                  )}
                >
                  {item.name}
                </a>
              ))}

              {/* SEO Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                      isToolActive()
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-200",
                    )}
                  >
                    <Gauge className="mr-2 h-4 w-4" />
                    SEO Tools
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {toolsNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "flex w-full items-center px-2 py-2 rounded-md text-sm",
                          isActive(item.href) && "bg-primary/10 text-primary",
                        )}
                      >
                        {item.icon}
                        {item.name}
                        {item.premium && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Premium
                          </span>
                        )}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Calculators Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                      isCalculatorActive()
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-200",
                    )}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculators
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[calc(100vh-100px)] overflow-y-auto">
                  {calculatorsNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "flex w-full items-center px-2 py-2 rounded-md text-sm",
                          isActive(item.href) && "bg-primary/10 text-primary",
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* PDF Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                      isPdfToolActive()
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-200",
                    )}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    PDF Tools
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[calc(100vh-100px)] overflow-y-auto">
                  {pdfToolsNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "flex w-full items-center px-2 py-2 rounded-md text-sm",
                          isActive(item.href) && "bg-primary/10 text-primary",
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Other Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                      isOtherToolActive()
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-200",
                    )}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Other Tools
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {otherToolsNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "flex w-full items-center px-2 py-2 rounded-md text-sm",
                          isActive(item.href) && "bg-primary/10 text-primary",
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Developer Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                      isDeveloperToolActive()
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "transition-colors duration-200",
                    )}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Developer Tools
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {developerToolsNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className={cn(
                          "flex w-full items-center px-2 py-2 rounded-md text-sm",
                          isActive(item.href) && "bg-primary/10 text-primary",
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Authentication */}
              <div className="ml-6 flex items-center">
                {isLoading ? (
                  <Button disabled variant="ghost">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </Button>
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline-block">
                          {user.displayName || user.username}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href="/history" className="cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          Analysis History
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        className="cursor-pointer"
                      >
                        {logoutMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging out...
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex space-x-2">
                    <a href="/login">
                      <Button variant="ghost">Login</Button>
                    </a>
                    <a href="/signup">
                      <Button variant="default">Sign Up</Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-primary"
                >
                  <Menu className="h-6 w-6 text-primary" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] p-0 flex flex-col h-full">
                <SheetHeader className="p-6 pb-2">
                  <SheetTitle className="text-left text-primary">
                    SEO Analyzer
                  </SheetTitle>
                  <SheetDescription>
                    Access all SEO tools
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto p-6 pt-2">
                  <div className="space-y-1">
                    {allNavigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-3 rounded-md text-base font-medium",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          "transition-colors duration-200",
                        )}
                      >
                        {item.icon}
                        {item.name}
                        {item.premium && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Premium
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="p-6 pt-2 border-t">
                  {isLoading ? (
                    <Button disabled variant="ghost" className="w-full justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : user ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Signed in as{" "}
                        <span className="font-medium text-foreground">
                          {user.displayName || user.username}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <a href="/history" className="block">
                          <Button variant="outline" className="w-full">
                            <History className="mr-2 h-4 w-4" />
                            History
                          </Button>
                        </a>
                        <Button
                          variant="destructive"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          className="w-full"
                        >
                          {logoutMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LogOut className="mr-2 h-4 w-4" />
                              Logout
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <a href="/login" className="block">
                        <Button variant="outline" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                      </a>
                      <a href="/signup" className="block mt-2">
                        <Button variant="default" className="w-full">
                          <User className="mr-2 h-4 w-4" />
                          Sign Up
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}