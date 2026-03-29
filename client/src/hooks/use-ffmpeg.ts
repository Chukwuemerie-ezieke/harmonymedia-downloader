import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    setMessage("Loading media engine...");

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("log", ({ message: msg }) => {
        setMessage(msg);
      });

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setLoaded(true);
      setMessage("Media engine ready");
    } catch (err) {
      setMessage("Failed to load media engine. Please refresh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  const convertFile = useCallback(
    async (
      file: File,
      outputFormat: string,
      options?: { startTime?: number; endTime?: number; audioOnly?: boolean }
    ): Promise<{ blob: Blob; filename: string } | null> => {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) return null;

      setProgress(0);
      setMessage("Processing...");

      const inputName = `input.${file.name.split(".").pop() || "mp4"}`;
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const outputName = `output.${outputFormat}`;

      try {
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args: string[] = ["-i", inputName];

        if (options?.startTime !== undefined) {
          args.push("-ss", String(options.startTime));
        }
        if (options?.endTime !== undefined) {
          args.push("-to", String(options.endTime));
        }
        if (options?.audioOnly) {
          args.push("-vn");
        }

        // Format-specific encoding
        const audioFormats = ["mp3", "wav", "aac", "ogg", "flac", "m4a", "wma"];
        const isAudioOutput = audioFormats.includes(outputFormat);

        if (isAudioOutput) {
          args.push("-vn"); // No video for audio outputs
          if (outputFormat === "mp3") {
            args.push("-codec:a", "libmp3lame", "-q:a", "2");
          } else if (outputFormat === "aac" || outputFormat === "m4a") {
            args.push("-codec:a", "aac", "-b:a", "192k");
          } else if (outputFormat === "ogg") {
            args.push("-codec:a", "libvorbis", "-q:a", "5");
          } else if (outputFormat === "flac") {
            args.push("-codec:a", "flac");
          } else if (outputFormat === "wav") {
            args.push("-codec:a", "pcm_s16le");
          }
        } else {
          // Video outputs
          if (outputFormat === "mp4") {
            args.push("-codec:v", "libx264", "-preset", "fast", "-crf", "23");
            args.push("-codec:a", "aac", "-b:a", "128k");
          } else if (outputFormat === "webm") {
            args.push("-codec:v", "libvpx", "-crf", "30", "-b:v", "0");
            args.push("-codec:a", "libvorbis");
          } else if (outputFormat === "avi") {
            args.push("-codec:v", "mpeg4", "-q:v", "5");
            args.push("-codec:a", "libmp3lame", "-q:a", "4");
          } else if (outputFormat === "mkv") {
            args.push("-codec:v", "libx264", "-preset", "fast", "-crf", "23");
            args.push("-codec:a", "aac", "-b:a", "128k");
          } else if (outputFormat === "mov") {
            args.push("-codec:v", "libx264", "-preset", "fast");
            args.push("-codec:a", "aac");
          } else if (outputFormat === "gif") {
            args.push("-vf", "fps=10,scale=480:-1:flags=lanczos");
          }
        }

        args.push("-y", outputName);

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const uint8 = data as Uint8Array;

        const mimeMap: Record<string, string> = {
          mp4: "video/mp4",
          webm: "video/webm",
          avi: "video/x-msvideo",
          mkv: "video/x-matroska",
          mov: "video/quicktime",
          gif: "image/gif",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          aac: "audio/aac",
          ogg: "audio/ogg",
          flac: "audio/flac",
          m4a: "audio/mp4",
          wma: "audio/x-ms-wma",
        };

        const blob = new Blob([uint8.buffer], {
          type: mimeMap[outputFormat] || "application/octet-stream",
        });

        // Cleanup
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch {}

        setProgress(100);
        setMessage("Done");

        return { blob, filename: `${baseName}.${outputFormat}` };
      } catch (err) {
        console.error("FFmpeg error:", err);
        setMessage("Processing failed. The file format may not be supported.");
        return null;
      }
    },
    []
  );

  return { load, loaded, loading, progress, message, convertFile };
}
