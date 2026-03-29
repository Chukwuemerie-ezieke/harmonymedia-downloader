// Cobalt API integration for URL-based video/audio downloading
// Uses the open-source cobalt.tools API

const COBALT_API = "https://api.cobalt.tools";

export interface CobaltResponse {
  status: "redirect" | "tunnel" | "picker" | "error";
  url?: string;
  picker?: Array<{
    type: "video" | "photo";
    url: string;
    thumb?: string;
  }>;
  text?: string;
  filename?: string;
}

export interface DownloadResult {
  url: string;
  filename: string;
  type: "video" | "audio";
}

export async function fetchVideoInfo(
  videoUrl: string,
  options?: {
    audioOnly?: boolean;
    quality?: string;
    format?: string;
  }
): Promise<CobaltResponse> {
  const body: Record<string, unknown> = {
    url: videoUrl,
    videoQuality: options?.quality || "1080",
    filenameStyle: "pretty",
  };

  if (options?.audioOnly) {
    body.downloadMode = "audio";
    body.audioFormat = options.format || "mp3";
  } else {
    body.downloadMode = "auto";
  }

  const response = await fetch(`${COBALT_API}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
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
