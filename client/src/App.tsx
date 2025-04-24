import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Results from "@/pages/Results";
import NotFound from "@/pages/not-found";
import SchemaGenerator from "./pages/SchemaGenerator";
import DomainAgeChecker from "./pages/DomainAgeChecker";
import DomainAuthorityChecker from "./pages/DomainAuthorityChecker";
import PlagiarismChecker from "./pages/PlagiarismChecker";
import ReadabilityChecker from "./pages/ReadabilityChecker";
import KeywordDensityChecker from "./pages/KeywordDensityChecker";
import FontGenerator from "./pages/FontGenerator";
import ImageCompressor from "./pages/ImageCompressor";
import Transliterate from "./pages/Transliterate";
import DiffChecker from "./pages/DiffChecker";
import ApiTester from "./pages/ApiTester";
import About from "./pages/About";
import Features from "./pages/Features";
import PreLaunchAudit from "./pages/PreLaunchAudit";
import ContentGapAnalyzer from "./pages/ContentGapAnalyzer";
import AnalysisHistory from "./pages/AnalysisHistory";
import AuthPage from "./pages/auth-page";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Import PDF Tools pages
import PdfToolsHome from "./pages/pdf-tools/PdfToolsHome";
import CompressPdf from "./pages/pdf-tools/CompressPdf";
import PdfToWord from "./pages/pdf-tools/PdfToWord";
import PdfToImage from "./pages/pdf-tools/PdfToImage";
import MergePdf from "./pages/pdf-tools/MergePdf";
import SplitPdf from "./pages/pdf-tools/SplitPdf";
import RotatePdf from "./pages/pdf-tools/RotatePdf";
import ProtectPdf from "./pages/pdf-tools/ProtectPdf";
import UnlockPdf from "./pages/pdf-tools/UnlockPdf";
import WatermarkPdf from "./pages/pdf-tools/WatermarkPdf";
import EditMetadata from "./pages/pdf-tools/EditMetadata";
import RemovePages from "./pages/pdf-tools/RemovePages";
import ReorderPdf from "./pages/pdf-tools/ReorderPdf";
import ExtractText from "./pages/pdf-tools/ExtractText";
import ExtractImages from "./pages/pdf-tools/ExtractImages";
import WordToPdf from "./pages/pdf-tools/WordToPdf";
import YoutubeDownloader from "./pages/YoutubeDownloader";

// Import Calculator pages
import CalculatorsHome from "./pages/calculators/CalculatorsHome";
import PercentageCalculator from "./pages/calculators/PercentageCalculator";
import EMICalculator from "./pages/calculators/EMICalculator";
import GSTCalculator from "./pages/calculators/GSTCalculator";
import UnitConverter from "./pages/calculators/UnitConverter";
import SIPCalculator from "./pages/calculators/SIPCalculator";
import RetirementCalculator from "./pages/calculators/RetirementCalculator";
import InvestmentCalculator from "./pages/calculators/InvestmentCalculator";
import IncomeTaxCalculator from "./pages/calculators/IncomeTaxCalculator";

function Router() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/results" component={Results} />
          <Route path="/schema" component={SchemaGenerator} />
          <Route path="/domain-age" component={DomainAgeChecker} />
          <Route path="/domain-authority" component={DomainAuthorityChecker} />
          <Route path="/plagiarism" component={PlagiarismChecker} />
          <Route path="/readability" component={ReadabilityChecker} />
          <Route path="/keyword-density" component={KeywordDensityChecker} />
          <Route path="/font-generator" component={FontGenerator} />
          <Route path="/image-compressor" component={ImageCompressor} />
          <Route path="/transliterate" component={Transliterate} />
          <Route path="/diff-checker" component={DiffChecker} />
          <Route path="/api-tester" component={ApiTester} />
          <Route path="/youtube-downloader" component={YoutubeDownloader} />
          {/* Premium features - requires authentication */}
          <ProtectedRoute path="/pre-launch-audit" component={PreLaunchAudit} />
          <ProtectedRoute path="/content-gap-analyzer" component={ContentGapAnalyzer} />
          <ProtectedRoute path="/history" component={AnalysisHistory} />
          {/* PDF Tools routes */}
          <Route path="/pdf-tools" component={PdfToolsHome} />
          {/* Using direct component rendering for now */}
          <Route path="/pdf-tools/compress" component={CompressPdf} />
          <Route path="/pdf-tools/pdf-to-word" component={PdfToWord} />
          <Route path="/pdf-tools/pdf-to-image" component={PdfToImage} />
          <Route path="/pdf-tools/word-to-pdf" component={WordToPdf} />
          <Route path="/pdf-tools/extract-text" component={ExtractText} />
          <Route path="/pdf-tools/extract-images" component={ExtractImages} />
          <Route path="/pdf-tools/merge" component={MergePdf} />
          <Route path="/pdf-tools/split" component={SplitPdf} />
          <Route path="/pdf-tools/reorder" component={ReorderPdf} />
          <Route path="/pdf-tools/rotate" component={RotatePdf} />
          <Route path="/pdf-tools/protect" component={ProtectPdf} />
          <Route path="/pdf-tools/unlock" component={UnlockPdf} />
          <Route path="/pdf-tools/watermark" component={WatermarkPdf} />
          <Route path="/pdf-tools/metadata" component={EditMetadata} />
          <Route path="/pdf-tools/remove-pages" component={RemovePages} />
          
          {/* Calculator routes */}
          <Route path="/calculators" component={CalculatorsHome} />
          <Route path="/calculators/percentage" component={PercentageCalculator} />
          <Route path="/calculators/emi" component={EMICalculator} />
          <Route path="/calculators/gst" component={GSTCalculator} />
          <Route path="/calculators/unit-converter" component={UnitConverter} />
          <Route path="/calculators/sip" component={SIPCalculator} />
          <Route path="/calculators/retirement" component={RetirementCalculator} />
          <Route path="/calculators/investment" component={InvestmentCalculator} />
          <Route path="/calculators/income-tax" component={IncomeTaxCalculator} />
          {/* Other routes */}
          <Route path="/about" component={About} />
          <Route path="/features" component={Features} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/auth" component={AuthPage} />
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