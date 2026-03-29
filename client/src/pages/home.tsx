import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchVideoInfo, detectPlatform, isValidUrl } from "@/lib/cobalt";
import {
  Download,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Music,
  Video,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Scissors,
  Play,
  ExternalLink,
} from "lucide-react";
import { SiYoutube, SiFacebook, SiInstagram, SiTiktok, SiX, SiVimeo, SiDailymotion, SiReddit } from "react-icons/si";

const PLATFORMS = [
  { name: "YouTube", icon: SiYoutube, color: "#FF0000" },
  { name: "Facebook", icon: SiFacebook, color: "#1877F2" },
  { name: "Instagram", icon: SiInstagram, color: "#E4405F" },
  { name: "TikTok", icon: SiTiktok, color: "#000000" },
  { name: "Twitter/X", icon: SiX, color: "#000000" },
  { name: "Vimeo", icon: SiVimeo, color: "#1AB7EA" },
  { name: "Dailymotion", icon: SiDailymotion, color: "#0066DC" },
  { name: "Reddit", icon: SiReddit, color: "#FF4500" },
];

const QUALITIES = [
  { value: "2160", label: "4K (2160p)" },
  { value: "1080", label: "Full HD (1080p)" },
  { value: "720", label: "HD (720p)" },
  { value: "480", label: "SD (480p)" },
  { value: "360", label: "Low (360p)" },
];

const SPECS = [
  { label: "Quality", value: "Up to 4K", icon: Monitor },
  { label: "Platforms", value: "1000+ Sites", icon: Globe },
  { label: "Cost", value: "100% Free", icon: Zap },
  { label: "Privacy", value: "No Tracking", icon: Shield },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState("1080");
  const [downloadMode, setDownloadMode] = useState<"auto" | "audio">("auto");
  const [audioFormat, setAudioFormat] = useState("mp3");
  const [loading, setLoading] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);
    setResult(null);
    if (value.trim()) {
      setDetectedPlatform(detectPlatform(value.trim()));
    } else {
      setDetectedPlatform(null);
    }
  };

  const handleDownload = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please paste a video URL");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setError("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchVideoInfo(trimmed, {
        audioOnly: downloadMode === "audio",
        quality,
        format: audioFormat,
      });

      if (response.status === "redirect" || response.status === "tunnel") {
        if (response.url) {
          setResult({ url: response.url, filename: response.filename || undefined });
          // Auto-open the download
          window.open(response.url, "_blank", "noopener,noreferrer");
          toast({ title: "Download started", description: "Your file is being downloaded." });
        }
      } else if (response.status === "picker" && response.picker?.length) {
        setResult({ url: response.picker[0].url, filename: undefined });
        window.open(response.picker[0].url, "_blank", "noopener,noreferrer");
        toast({ title: "Download started", description: "Your file is being downloaded." });
      } else if (response.status === "error") {
        setError(response.text || "This video could not be processed. It may be private, region-locked, or from an unsupported platform.");
      } else {
        setError("Could not retrieve download link. Please check the URL and try again.");
      }
    } catch (err: unknown) {
      console.error("Download error:", err);
      setError("The download service is temporarily unavailable. Please try again in a moment or use a different URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium" data-testid="badge-free">
              Free &middot; No Registration &middot; Unlimited
            </Badge>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 leading-tight">
              Download Videos & Audio{" "}
              <span className="text-primary">from Any Platform</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Paste a link from YouTube, Facebook, Instagram, TikTok, or 1000+
              other sites. Choose your quality and format — download starts instantly.
            </p>
          </div>

          {/* Download Box */}
          <Card className="max-w-2xl mx-auto shadow-lg border-border/60" data-testid="download-card">
            <CardContent className="p-5 sm:p-6">
              {/* Mode Tabs */}
              <Tabs value={downloadMode} onValueChange={(v) => setDownloadMode(v as "auto" | "audio")} className="mb-4">
                <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto" data-testid="mode-tabs">
                  <TabsTrigger value="auto" className="text-xs sm:text-sm gap-1.5" data-testid="tab-video">
                    <Video className="w-3.5 h-3.5" /> Video
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="text-xs sm:text-sm gap-1.5" data-testid="tab-audio">
                    <Music className="w-3.5 h-3.5" /> Audio Only
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* URL Input */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    type="url"
                    placeholder="Paste video or audio URL here..."
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleDownload(); }}
                    className="h-11 text-sm pr-10"
                    data-testid="input-url"
                  />
                  {detectedPlatform && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {detectedPlatform}
                    </span>
                  )}
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={loading || !url.trim()}
                  className="h-11 px-6 font-semibold text-sm"
                  data-testid="button-download"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Processing..." : "Download"}
                </Button>
              </div>

              {/* Quality & Format Options */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger className="h-9 text-xs flex-1" data-testid="select-quality">
                    <SelectValue placeholder="Quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {downloadMode === "audio" && (
                  <Select value={audioFormat} onValueChange={setAudioFormat}>
                    <SelectTrigger className="h-9 text-xs flex-1" data-testid="select-audio-format">
                      <SelectValue placeholder="Audio Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="opus">OPUS</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Status Messages */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs" data-testid="error-message">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-destructive">{error}</p>
                </div>
              )}
              {result && (
                <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20" data-testid="success-message">
                  <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Download ready. If it didn't start automatically:</span>
                  </div>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                By using this service you agree to our terms. Only download content you have the right to use.
              </p>
            </CardContent>
          </Card>

          {/* Platform Icons */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 max-w-lg mx-auto">
            {PLATFORMS.map(({ name, icon: Icon, color }) => (
              <div key={name} className="flex flex-col items-center gap-1 group cursor-default" data-testid={`platform-${name}`}>
                <div className="w-10 h-10 rounded-xl bg-card border border-border/60 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specs Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECS.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="text-center mb-10">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-2">
            How It Works
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Three simple steps to download any video or audio
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { step: "1", title: "Paste the URL", desc: "Copy the video link from YouTube, Facebook, Instagram, TikTok, or any supported platform and paste it above.", icon: Globe },
            { step: "2", title: "Choose Quality", desc: "Select your preferred video quality (up to 4K) or switch to audio-only mode to download just the soundtrack.", icon: Play },
            { step: "3", title: "Download", desc: "Click Download and your file will be ready in seconds. No registration, no watermarks, no limits.", icon: Download },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="relative text-center p-6">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-4">
                {step}
              </div>
              <h3 className="text-sm font-semibold mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* More Tools Section */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
          <div className="text-center mb-10">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-2">
              More Media Tools
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Beyond downloading — convert, extract, and trim your media files
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { title: "Format Converter", desc: "Convert between MP4, WebM, AVI, MKV, MOV, GIF, MP3, WAV, AAC, OGG, FLAC and more.", icon: ArrowRightLeft, href: "/converter" },
              { title: "Audio Extractor", desc: "Pull audio tracks from any video file. Perfect for saving lecture audio or music.", icon: Music, href: "/converter" },
              { title: "Video Trimmer", desc: "Cut videos and audio to precise start and end times. Extract the segments you need.", icon: Scissors, href: "/converter" },
            ].map(({ title, desc, icon: Icon, href }) => (
              <Link key={title} href={href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                      <Icon className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1.5 group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3">
                      Open tool <ArrowRight className="w-3 h-3" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="text-center mb-10">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-2">
            Supported Platforms
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Download from 1000+ websites including all major video and social platforms
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {[
            { name: "YouTube", icon: SiYoutube, color: "#FF0000", desc: "Videos, Shorts, Music" },
            { name: "Facebook", icon: SiFacebook, color: "#1877F2", desc: "Videos, Reels, Stories" },
            { name: "Instagram", icon: SiInstagram, color: "#E4405F", desc: "Reels, Stories, IGTV" },
            { name: "TikTok", icon: SiTiktok, color: "#000000", desc: "Videos, Slideshows" },
            { name: "Twitter / X", icon: SiX, color: "#000000", desc: "Videos, GIFs" },
            { name: "Vimeo", icon: SiVimeo, color: "#1AB7EA", desc: "Videos, Showcases" },
            { name: "Dailymotion", icon: SiDailymotion, color: "#0066DC", desc: "Videos, Channels" },
            { name: "Reddit", icon: SiReddit, color: "#FF4500", desc: "Videos, GIFs" },
          ].map(({ name, icon: Icon, color, desc }) => (
            <Card key={name} className="text-center">
              <CardContent className="p-4">
                <Icon className="w-6 h-6 mx-auto mb-2" style={{ color }} />
                <p className="text-xs font-semibold">{name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          + SoundCloud, Twitch, Pinterest, Tumblr, Bilibili, Streamable, Loom and hundreds more
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Is HarmonyMedia Downloader free?", a: "Yes, completely free. No registration, no hidden fees, no download limits. Use it as much as you need." },
              { q: "Which video qualities are supported?", a: "We support downloading in resolutions from 360p up to 4K (2160p), depending on what the original video offers. The tool automatically selects the best available quality." },
              { q: "Can I download audio only?", a: "Yes. Switch to 'Audio Only' mode and choose your preferred format (MP3, OGG, WAV, or OPUS). Perfect for saving music, podcasts, and lecture audio." },
              { q: "Is it safe and private?", a: "Your privacy matters. We don't store your URLs, downloaded files, or any personal data. The service processes your request and delivers the file — nothing is saved on our end." },
              { q: "Does it work on mobile phones?", a: "Yes. HarmonyMedia Downloader works on any device with a modern browser — smartphones, tablets, laptops, and desktops. No app installation needed." },
              { q: "What about copyright?", a: "This tool is designed for downloading content you have the rights to use — your own videos, Creative Commons content, public domain material, and educational resources. Downloading copyrighted content without permission is prohibited." },
            ].map(({ q, a }, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border border-border/60">
                <h3 className="text-sm font-semibold mb-1.5">{q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
