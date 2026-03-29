import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface VideoInfo {
  url: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  formats?: Array<{
    format_id: string;
    ext: string;
    resolution: string;
    filesize?: number;
    url: string;
    acodec: string;
    vcodec: string;
  }>;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "HarmonyMedia Downloader" });
  });

  // Get video info and download URL
  app.post("/api/download", async (req, res) => {
    try {
      const { url, quality = "1080", audioOnly = false, audioFormat = "mp3" } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL format
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return res.status(400).json({ error: "Invalid URL protocol" });
        }
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Build yt-dlp command to get info + direct URL
      const escapedUrl = url.replace(/'/g, "'\\''");

      if (audioOnly) {
        // Audio-only mode
        const cmd = `yt-dlp --no-warnings --no-check-certificates -j -f "bestaudio[ext=${audioFormat}]/bestaudio/best" '${escapedUrl}' 2>/dev/null`;

        try {
          const { stdout } = await execAsync(cmd, { timeout: 30000, maxBuffer: 5 * 1024 * 1024 });
          const info = JSON.parse(stdout.trim());

          return res.json({
            status: "success",
            url: info.url || info.webpage_url,
            filename: `${sanitizeFilename(info.title || "audio")}.${info.ext || audioFormat}`,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            type: "audio",
          });
        } catch {
          // Fallback: just get the URL
          const fallbackCmd = `yt-dlp --no-warnings --no-check-certificates --get-url -f "bestaudio/best" '${escapedUrl}' 2>/dev/null`;
          const titleCmd = `yt-dlp --no-warnings --no-check-certificates --get-title '${escapedUrl}' 2>/dev/null`;

          const [urlResult, titleResult] = await Promise.allSettled([
            execAsync(fallbackCmd, { timeout: 30000 }),
            execAsync(titleCmd, { timeout: 15000 }),
          ]);

          const downloadUrl = urlResult.status === "fulfilled" ? urlResult.value.stdout.trim().split("\n")[0] : null;
          const title = titleResult.status === "fulfilled" ? titleResult.value.stdout.trim() : "audio";

          if (!downloadUrl) {
            return res.status(422).json({
              error: "Could not extract download URL. The video may be private, region-locked, or from an unsupported platform.",
            });
          }

          return res.json({
            status: "success",
            url: downloadUrl,
            filename: `${sanitizeFilename(title)}.${audioFormat}`,
            title,
            type: "audio",
          });
        }
      } else {
        // Video mode — get best video+audio combined
        const qualityMap: Record<string, string> = {
          "2160": "bestvideo[height<=2160]+bestaudio/best[height<=2160]/best",
          "1080": "bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
          "720": "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
          "480": "bestvideo[height<=480]+bestaudio/best[height<=480]/best",
          "360": "bestvideo[height<=360]+bestaudio/best[height<=360]/best",
        };

        // First try to get a single combined format (mp4 with audio+video)
        const singleFormat = `best[height<=${quality}][ext=mp4]/best[height<=${quality}]/best`;
        const cmd = `yt-dlp --no-warnings --no-check-certificates -j -f "${singleFormat}" '${escapedUrl}' 2>/dev/null`;

        try {
          const { stdout } = await execAsync(cmd, { timeout: 30000, maxBuffer: 5 * 1024 * 1024 });
          const info = JSON.parse(stdout.trim());

          return res.json({
            status: "success",
            url: info.url || info.webpage_url,
            filename: `${sanitizeFilename(info.title || "video")}.${info.ext || "mp4"}`,
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            resolution: info.resolution || `${info.width}x${info.height}`,
            type: "video",
          });
        } catch {
          // Fallback: just get direct URL
          const fallbackCmd = `yt-dlp --no-warnings --no-check-certificates --get-url -f "${singleFormat}" '${escapedUrl}' 2>/dev/null`;
          const titleCmd = `yt-dlp --no-warnings --no-check-certificates --get-title '${escapedUrl}' 2>/dev/null`;

          const [urlResult, titleResult] = await Promise.allSettled([
            execAsync(fallbackCmd, { timeout: 30000 }),
            execAsync(titleCmd, { timeout: 15000 }),
          ]);

          const downloadUrl = urlResult.status === "fulfilled" ? urlResult.value.stdout.trim().split("\n")[0] : null;
          const title = titleResult.status === "fulfilled" ? titleResult.value.stdout.trim() : "video";

          if (!downloadUrl) {
            return res.status(422).json({
              error: "Could not extract download URL. The video may be private, region-locked, or from an unsupported platform.",
            });
          }

          return res.json({
            status: "success",
            url: downloadUrl,
            filename: `${sanitizeFilename(title)}.mp4`,
            title,
            type: "video",
          });
        }
      }
    } catch (err: unknown) {
      console.error("Download API error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: `Download processing failed: ${message}` });
    }
  });

  // Proxy endpoint - streams the video through the server to avoid CORS
  app.get("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      const filename = req.query.filename as string || "download";

      if (!targetUrl) {
        return res.status(400).json({ error: "URL parameter required" });
      }

      // Set headers for download
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Use fetch to stream
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch media" });
      }

      if (response.headers.get("content-type")) {
        res.setHeader("Content-Type", response.headers.get("content-type")!);
      }
      if (response.headers.get("content-length")) {
        res.setHeader("Content-Length", response.headers.get("content-length")!);
      }

      // Pipe the stream
      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: "Failed to read stream" });
      }

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise((resolve) => res.once("drain", resolve));
          }
        }
        res.end();
      };

      await pump();
    } catch (err) {
      console.error("Proxy error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Proxy failed" });
      }
    }
  });

  return httpServer;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
