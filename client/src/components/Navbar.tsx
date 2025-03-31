import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function Navbar() {
  const navigation = [
    { name: "Home", href: "/" },
    { name: "Plagiarism Checker", href: "/plagiarism" },
    { name: "About", href: "/about" },
    { name: "Features", href: "/features" },
    { name: "Schema Generator", href: "/schema" },
    { name: "Domain Age Checker", href: "/domain-age" },
  ];

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
                    "px-3 py-2 rounded-md text-sm font-medium",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
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
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[280px]">
                <div className="py-4">
                  <div className="mt-4 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "block px-3 py-2 rounded-md text-base font-medium",
                          "text-foreground hover:bg-accent hover:text-accent-foreground",
                          "transition-colors duration-200"
                        )}
                      >
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