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
import About from "./pages/About";
import Features from "./pages/Features";
import PreLaunchAudit from "./pages/PreLaunchAudit";
import AuthPage from "./pages/auth-page";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

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
          {/* Premium feature - requires authentication */}
          <ProtectedRoute path="/pre-launch-audit" component={PreLaunchAudit} />
          <Route path="/about" component={About} />
          <Route path="/features" component={Features} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
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