import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Download, ArrowRightLeft } from "lucide-react";

function HarmonyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-label="HarmonyMedia Downloader logo">
      <rect width="36" height="36" rx="9" fill="hsl(262, 83%, 58%)" />
      <path d="M18 7l-8 11h5v11h6V18h5z" fill="white" opacity="0.95" />
    </svg>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2.5 cursor-pointer">
              <HarmonyLogo className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight tracking-tight">
                  HarmonyMedia
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight">
                  by Harmony Digital Consults Ltd
                </span>
              </div>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs gap-1.5 h-8"
                data-testid="nav-downloader"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Downloader</span>
              </Button>
            </Link>
            <Link href="/converter">
              <Button
                variant={location === "/converter" ? "secondary" : "ghost"}
                size="sm"
                className="text-xs gap-1.5 h-8"
                data-testid="nav-converter"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Converter</span>
              </Button>
            </Link>
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="w-8 h-8"
              data-testid="button-theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HarmonyLogo className="w-6 h-6" />
                <span className="text-sm font-semibold">HarmonyMedia</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A product of Harmony Digital Consults Ltd. Empowering educators
                and learners with accessible media tools.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3">Tools</h4>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/">
                    <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Video Downloader</span>
                  </Link>
                </li>
                <li>
                  <Link href="/converter">
                    <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Format Converter</span>
                  </Link>
                </li>
                <li>
                  <Link href="/converter">
                    <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Audio Extractor</span>
                  </Link>
                </li>
                <li>
                  <Link href="/converter">
                    <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Video Trimmer</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3">Platforms</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                YouTube, Facebook, Instagram, TikTok, Twitter/X, Vimeo, Dailymotion,
                Reddit, SoundCloud, Twitch, and 1000+ more.
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              &copy; {new Date().getFullYear()} Harmony Digital Consults Ltd. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground">
              This service is for educational and personal use only. Respect content creators' rights.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
