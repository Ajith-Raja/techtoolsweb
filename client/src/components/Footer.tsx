import { Twitter, Linkedin, Github, Mail, MessageSquare, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        {/* <div className="rounded-2xl bg-primary-foreground p-6 md:p-8 mb-12">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <h3 className="text-xl font-bold">Subscribe to our newsletter</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get the latest SEO tips, tools, and updates delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full sm:max-w-xs"
              />
              <Button variant="default">
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div> */}
        
        <div className="xl:grid xl:grid-cols-4 xl:gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <a href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">Tech Tools</span>
            </a>
            {/* <p className="text-sm text-muted-foreground">
              Advanced SEO analysis and recommendations to improve your website's visibility and ranking.
            </p> */}
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links section */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold">Features</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    SEO Analysis
                  </a>
                </li>
                <li>
                  <a href="/plagiarism" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Plagiarism Checker
                  </a>
                </li>
                <li>
                  <a href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Content Analysis
                  </a>
                </li>
                <li>
                  <a href="/schema" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Schema Generator
                  </a>
                </li>
                <li>
                  <a href="/domain-age" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Domain Age Checker
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Company</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact section */}
          <div className="mt-12 xl:mt-0">
            <h3 className="text-sm font-semibold">Contact Us</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  123 SEO Street, Web City, Internet 12345
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">support@seoanalyzer.com</span>
              </li>
              <li className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Live chat available 24/7</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">
              © {new Date().getFullYear()} SEO Analyzer. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms
              </a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Cookies
              </a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
