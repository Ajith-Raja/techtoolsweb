import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/NavbarNew";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Loader2 } from "lucide-react";
import React, { lazy, Suspense } from 'react';

// Only Home and NotFound are statically imported for fast initial load
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

// Lazy load all other components for better performance
const Results = lazy(() => import("@/pages/Results"));
const SchemaGenerator = lazy(() => import("./pages/SchemaGenerator"));
const DomainAgeChecker = lazy(() => import("./pages/DomainAgeChecker"));
const DomainAuthorityChecker = lazy(() => import("./pages/DomainAuthorityChecker"));
const PlagiarismChecker = lazy(() => import("./pages/PlagiarismChecker"));
const ReadabilityChecker = lazy(() => import("./pages/ReadabilityChecker"));
const KeywordDensityChecker = lazy(() => import("./pages/KeywordDensityChecker"));
const FontGenerator = lazy(() => import("./pages/FontGenerator"));
const ImageCompressor = lazy(() => import("./pages/ImageCompressor"));
const Transliterate = lazy(() => import("./pages/Transliterate"));
const DiffChecker = lazy(() => import("./pages/DiffChecker"));
const ApiTester = lazy(() => import("./pages/ApiTester"));
const About = lazy(() => import("./pages/About"));
const Features = lazy(() => import("./pages/Features"));
const PreLaunchAudit = lazy(() => import("./pages/PreLaunchAudit"));
const ContentGapAnalyzer = lazy(() => import("./pages/ContentGapAnalyzer"));
const AnalysisHistory = lazy(() => import("./pages/AnalysisHistory"));
const AuthPage = lazy(() => import("./pages/auth-page"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

// PDF Tools pages
const PdfToolsHome = lazy(() => import("./pages/pdf-tools/PdfToolsHome"));
const CompressPdf = lazy(() => import("./pages/pdf-tools/CompressPdf"));
const PdfToWord = lazy(() => import("./pages/pdf-tools/PdfToWord"));
const PdfToImage = lazy(() => import("./pages/pdf-tools/PdfToImage"));
const MergePdf = lazy(() => import("./pages/pdf-tools/MergePdf"));
const SplitPdf = lazy(() => import("./pages/pdf-tools/SplitPdf"));
const RotatePdf = lazy(() => import("./pages/pdf-tools/RotatePdf"));
const ProtectPdf = lazy(() => import("./pages/pdf-tools/ProtectPdf"));
const UnlockPdf = lazy(() => import("./pages/pdf-tools/UnlockPdf"));
const WatermarkPdf = lazy(() => import("./pages/pdf-tools/WatermarkPdf"));
const EditMetadata = lazy(() => import("./pages/pdf-tools/EditMetadata"));
const RemovePages = lazy(() => import("./pages/pdf-tools/RemovePages"));
const ReorderPdf = lazy(() => import("./pages/pdf-tools/ReorderPdf"));
const ExtractText = lazy(() => import("./pages/pdf-tools/ExtractText"));
const ExtractImages = lazy(() => import("./pages/pdf-tools/ExtractImages"));
const WordToPdf = lazy(() => import("./pages/pdf-tools/WordToPdf"));
const YoutubeDownloader = lazy(() => import("./pages/YoutubeDownloader"));
const QRCodeGenerator = lazy(() => import("./pages/QRCodeGenerator"));
const RegexTester = lazy(() => import("./pages/RegexTester"));
const ImageToSvgConverter = lazy(() => import("./pages/ImageToSvgConverter"));
const CalendarGenerator = lazy(() => import("./pages/CalendarGenerator"));

// Calculator pages
const CalculatorsHome = lazy(() => import("./pages/calculators/CalculatorsHome"));
const PercentageCalculator = lazy(() => import("./pages/calculators/PercentageCalculator"));
const EMICalculator = lazy(() => import("./pages/calculators/EMICalculator"));
const GSTCalculator = lazy(() => import("./pages/calculators/GSTCalculator"));
const UnitConverter = lazy(() => import("./pages/calculators/UnitConverter"));
const SIPCalculator = lazy(() => import("./pages/calculators/SIPCalculator"));
const RetirementCalculator = lazy(() => import("./pages/calculators/RetirementCalculator"));
const InvestmentCalculator = lazy(() => import("./pages/calculators/InvestmentCalculator"));
const IncomeTaxCalculator = lazy(() => import("./pages/calculators/IncomeTaxCalculator"));
const TimezoneConverter = lazy(() => import("./pages/calculators/TimezoneConverter"));
const UnixTimestampConverter = lazy(() => import("./pages/calculators/UnixTimestampConverter"));
const BirthdayCalculator = lazy(() => import("./pages/calculators/BirthdayCalculator"));

// Developer Tools pages
const ResponsiveTableGenerator = lazy(() => import("./pages/dev-tools/ResponsiveTableGenerator"));
const JwtDecoder = lazy(() => import("./pages/dev-tools/JwtDecoder"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center">
      <div className="rounded-full bg-primary/30 h-12 w-12 mb-4 flex items-center justify-center">
        <div className="rounded-full bg-primary h-8 w-8 animate-spin"></div>
      </div>
      <div className="h-4 bg-primary/20 rounded w-32"></div>
    </div>
  </div>
);

// Preload components for frequently accessed pages
setTimeout(() => {
  import("./pages/PlagiarismChecker");
  import("./pages/pdf-tools/MergePdf");
  import("./pages/QRCodeGenerator");
}, 2000);

// Custom Route wrapper that uses Suspense for lazy loading
const LazyRoute = ({ component: Component, ...rest }: any) => {
  return (
    <Route
      {...rest}
      component={(props: any) => (
        <Suspense fallback={<PageLoader />}>
          <Component {...props} />
        </Suspense>
      )}
    />
  );
};

// Custom Route wrapper for protected routes with Suspense
const LazyProtectedRoute = ({ component: Component, ...rest }: any) => {
  return (
    <ProtectedRoute
      {...rest}
      component={(props: any) => (
        <Suspense fallback={<PageLoader />}>
          <Component {...props} />
        </Suspense>
      )}
    />
  );
};

function Router() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          {/* Home is directly imported for fast initial load */}
          <Route path="/" component={Home} />
          
          {/* Dynamic imports with loading indicators for all other routes */}
          <LazyRoute path="/results" component={Results} />
          <LazyRoute path="/schema" component={SchemaGenerator} />
          <LazyRoute path="/domain-age" component={DomainAgeChecker} />
          <LazyRoute path="/domain-authority" component={DomainAuthorityChecker} />
          <LazyRoute path="/plagiarism" component={PlagiarismChecker} />
          <LazyRoute path="/readability" component={ReadabilityChecker} />
          <LazyRoute path="/keyword-density" component={KeywordDensityChecker} />
          <LazyRoute path="/font-generator" component={FontGenerator} />
          <LazyRoute path="/image-compressor" component={ImageCompressor} />
          <LazyRoute path="/transliterate" component={Transliterate} />
          <LazyRoute path="/diff-checker" component={DiffChecker} />
          <LazyRoute path="/api-tester" component={ApiTester} />
          <LazyRoute path="/youtube-downloader" component={YoutubeDownloader} />
          <LazyRoute path="/qr-code-generator" component={QRCodeGenerator} />
          <LazyRoute path="/regex-tester" component={RegexTester} />
          <LazyRoute path="/image-to-svg" component={ImageToSvgConverter} />
          <LazyRoute path="/calendar-generator" component={CalendarGenerator} />
          
          {/* Premium features - requires authentication */}
          <LazyProtectedRoute path="/pre-launch-audit" component={PreLaunchAudit} />
          <LazyProtectedRoute path="/content-gap-analyzer" component={ContentGapAnalyzer} />
          <LazyProtectedRoute path="/history" component={AnalysisHistory} />
          
          {/* PDF Tools routes */}
          <LazyRoute path="/pdf-tools" component={PdfToolsHome} />
          <LazyRoute path="/pdf-tools/compress" component={CompressPdf} />
          <LazyRoute path="/pdf-tools/pdf-to-word" component={PdfToWord} />
          <LazyRoute path="/pdf-tools/pdf-to-image" component={PdfToImage} />
          <LazyRoute path="/pdf-tools/word-to-pdf" component={WordToPdf} />
          <LazyRoute path="/pdf-tools/extract-text" component={ExtractText} />
          <LazyRoute path="/pdf-tools/extract-images" component={ExtractImages} />
          <LazyRoute path="/pdf-tools/merge" component={MergePdf} />
          <LazyRoute path="/pdf-tools/split" component={SplitPdf} />
          <LazyRoute path="/pdf-tools/reorder" component={ReorderPdf} />
          <LazyRoute path="/pdf-tools/rotate" component={RotatePdf} />
          <LazyRoute path="/pdf-tools/protect" component={ProtectPdf} />
          <LazyRoute path="/pdf-tools/unlock" component={UnlockPdf} />
          <LazyRoute path="/pdf-tools/watermark" component={WatermarkPdf} />
          <LazyRoute path="/pdf-tools/metadata" component={EditMetadata} />
          <LazyRoute path="/pdf-tools/remove-pages" component={RemovePages} />
          
          {/* Calculator routes */}
          <LazyRoute path="/calculators" component={CalculatorsHome} />
          <LazyRoute path="/calculators/percentage" component={PercentageCalculator} />
          <LazyRoute path="/calculators/emi" component={EMICalculator} />
          <LazyRoute path="/calculators/gst" component={GSTCalculator} />
          <LazyRoute path="/calculators/unit-converter" component={UnitConverter} />
          <LazyRoute path="/calculators/sip" component={SIPCalculator} />
          <LazyRoute path="/calculators/retirement" component={RetirementCalculator} />
          <LazyRoute path="/calculators/investment" component={InvestmentCalculator} />
          <LazyRoute path="/calculators/income-tax" component={IncomeTaxCalculator} />
          <LazyRoute path="/calculators/timezone-converter" component={TimezoneConverter} />
          <LazyRoute path="/calculators/unix-timestamp-converter" component={UnixTimestampConverter} />
          <LazyRoute path="/calculators/birthday-calculator" component={BirthdayCalculator} />
          
          {/* Developer Tools routes */}
          <LazyRoute path="/dev-tools/table-generator" component={ResponsiveTableGenerator} />
          <LazyRoute path="/dev-tools/jwt-decoder" component={JwtDecoder} />
          
          {/* Other routes */}
          <LazyRoute path="/about" component={About} />
          <LazyRoute path="/features" component={Features} />
          <LazyRoute path="/login" component={Login} />
          <LazyRoute path="/signup" component={Signup} />
          <LazyRoute path="/auth" component={AuthPage} />
          
          {/* Not Found is directly imported */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;