// Video download integration
// Uses server-side yt-dlp API for reliable multi-platform downloading

// Resolve API base relative to current page (works both in dev and production)
function getApiBase(): string {
  // In dev, the Vite dev server proxies to Express on the same port
  return "";
}

export interface DownloadResponse {
  status: "success";
  url: string;
  filename: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  resolution?: string;
  type: "video" | "audio";
}

export interface DownloadError {
  error: string;
}

export async function fetchVideoInfo(
  videoUrl: string,
  options?: {
    audioOnly?: boolean;
    quality?: string;
    format?: string;
  }
): Promise<{ status: "success" | "error"; url?: string; filename?: string; title?: string; text?: string }> {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}/api/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      url: videoUrl,
      quality: options?.quality || "1080",
      audioOnly: options?.audioOnly || false,
      audioFormat: options?.format || "mp3",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      status: "error",
      text: data.error || "Download processing failed. Please check the URL and try again.",
    };
  }

  // Build proxy URL for CORS-safe downloading
  const proxyUrl = `${apiBase}/api/proxy?url=${encodeURIComponent(data.url)}&filename=${encodeURIComponent(data.filename || "download")}`;

  return {
    status: "success",
    url: proxyUrl,
    filename: data.filename,
    title: data.title,
  };
}

// Supported platforms detection
export function detectPlatform(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const platforms: Record<string, string> = {
      "youtube.com": "YouTube",
      "youtu.be": "YouTube",
      "m.youtube.com": "YouTube",
      "facebook.com": "Facebook",
      "fb.watch": "Facebook",
      "m.facebook.com": "Facebook",
      "instagram.com": "Instagram",
      "tiktok.com": "TikTok",
      "vm.tiktok.com": "TikTok",
      "twitter.com": "Twitter/X",
      "x.com": "Twitter/X",
      "vimeo.com": "Vimeo",
      "dailymotion.com": "Dailymotion",
      "dai.ly": "Dailymotion",
      "reddit.com": "Reddit",
      "soundcloud.com": "SoundCloud",
      "twitch.tv": "Twitch",
      "pinterest.com": "Pinterest",
      "tumblr.com": "Tumblr",
      "bilibili.com": "Bilibili",
      "ok.ru": "OK.ru",
      "rutube.ru": "Rutube",
      "streamable.com": "Streamable",
      "loom.com": "Loom",
      "vine.co": "Vine",
    };

    for (const [domain, name] of Object.entries(platforms)) {
      if (hostname.includes(domain)) return name;
    }
    return "Website";
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
