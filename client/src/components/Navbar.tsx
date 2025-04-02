import { Menu, Search, BarChart, BookOpen, FileQuestion, Activity, TrendingUp, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

export function Navbar() {
  const [location] = useLocation();
  
  const navigation = [
    { name: "Home", href: "/", icon: <HomeIcon className="mr-2 h-4 w-4" /> },
    { name: "Plagiarism Checker", href: "/plagiarism", icon: <FileQuestion className="mr-2 h-4 w-4" /> },
    { name: "About", href: "/about", icon: <BookOpen className="mr-2 h-4 w-4" /> },
    { name: "Features", href: "/features", icon: <BarChart className="mr-2 h-4 w-4" /> },
    { name: "Schema Generator", href: "/schema", icon: <Activity className="mr-2 h-4 w-4" /> },
    { name: "Domain Age Checker", href: "/domain-age", icon: <Search className="mr-2 h-4 w-4" /> },
    { name: "Domain Authority", href: "/domain-authority", icon: <TrendingUp className="mr-2 h-4 w-4" /> },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">SEO Analyzer</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-200"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-primary">
                  <Menu className="h-6 w-6 text-primary" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-left text-primary">SEO Analyzer</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <div className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-3 rounded-md text-base font-medium",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          "transition-colors duration-200"
                        )}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}