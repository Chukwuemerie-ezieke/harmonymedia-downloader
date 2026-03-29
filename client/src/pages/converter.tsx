import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import {
  ArrowRightLeft,
  Music,
  Scissors,
  Upload,
  FileVideo,
  FileAudio,
  Loader2,
  X,
  ArrowLeft,
} from "lucide-react";

const VIDEO_FORMATS = ["mp4", "webm", "avi", "mkv", "mov", "gif"];
const AUDIO_FORMATS = ["mp3", "wav", "aac", "ogg", "flac", "m4a"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Converter() {
  const { load, loaded, loading, progress, message, convertFile } = useFFmpeg();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("convert");
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState("mp4");
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioFormat, setAudioFormat] = useState("mp3");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideoFile = (f: File) => f.type.startsWith("video/");
  const isAudioFile = (f: File) => f.type.startsWith("audio/");
  const isMediaFile = (f: File) => isVideoFile(f) || isAudioFile(f);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!isMediaFile(selectedFile)) {
      toast({ title: "Unsupported file", description: "Please select a video or audio file.", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    setStartTime(0);
    setEndTime(0);
    setDuration(0);

    if (isVideoFile(selectedFile)) {
      const url = URL.createObjectURL(selectedFile);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { setDuration(v.duration); setEndTime(v.duration); URL.revokeObjectURL(url); };
      v.src = url;
    } else if (isAudioFile(selectedFile)) {
      const url = URL.createObjectURL(selectedFile);
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => { setDuration(a.duration); setEndTime(a.duration); URL.revokeObjectURL(url); };
      a.src = url;
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const handleProcess = async () => {
    if (!file) return;
    if (!loaded) await load();
    setProcessing(true);

    try {
      let result: { blob: Blob; filename: string } | null = null;
      if (activeTab === "convert") {
        result = await convertFile(file, outputFormat);
      } else if (activeTab === "extract") {
        result = await convertFile(file, audioFormat, { audioOnly: true });
      } else if (activeTab === "trim") {
        const ext = file.name.split(".").pop() || "mp4";
        result = await convertFile(file, ext, { startTime, endTime });
      }

      if (result) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url; a.download = result.filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "File ready", description: `${result.filename} (${formatFileSize(result.blob.size)}) downloaded.` });
      }
    } catch {
      toast({ title: "Error", description: "Processing failed. Try a different file or format.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back nav */}
      <Link href="/">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Downloader
        </span>
      </Link>

      <div className="text-center mb-8">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Media Converter & Editor
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Convert formats, extract audio, and trim clips. All processing happens in your browser — files never leave your device.
        </p>
        <Badge variant="outline" className="mt-3 text-xs font-normal">
          {loaded ? "Engine Ready" : loading ? "Loading engine..." : "Waiting"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6" data-testid="converter-tabs">
          <TabsTrigger value="convert" className="text-xs sm:text-sm gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5" /> Convert</TabsTrigger>
          <TabsTrigger value="extract" className="text-xs sm:text-sm gap-1.5"><Music className="w-3.5 h-3.5" /> Extract</TabsTrigger>
          <TabsTrigger value="trim" className="text-xs sm:text-sm gap-1.5"><Scissors className="w-3.5 h-3.5" /> Trim</TabsTrigger>
        </TabsList>

        {/* File Upload */}
        <Card className="mb-6 border-dashed border-2 bg-card/60">
          <CardContent className="p-0">
            <div
              className={`flex flex-col items-center justify-center py-10 px-4 cursor-pointer transition-colors rounded-lg ${dragOver ? "bg-primary/5" : "hover:bg-muted/40"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              data-testid="dropzone"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            >
              <input ref={fileInputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {isVideoFile(file) ? <FileVideo className="w-6 h-6 text-primary" /> : <FileAudio className="w-6 h-6 text-secondary" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}{duration > 0 && ` · ${formatTime(duration)}`}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setDuration(0); }} className="text-xs text-muted-foreground">
                    <X className="w-3 h-3 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop your file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">MP4, WebM, AVI, MKV, MOV, MP3, WAV, AAC, OGG, FLAC</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Convert */}
        <TabsContent value="convert">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Output Format</label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Video</div>
                      {VIDEO_FORMATS.map((f) => <SelectItem key={f} value={f}>.{f.toUpperCase()}</SelectItem>)}
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-1.5">Audio</div>
                      {AUDIO_FORMATS.map((f) => <SelectItem key={f} value={f}>.{f.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleProcess} disabled={!file || processing} className="w-full sm:w-auto">
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
                  {processing ? "Converting..." : "Convert"}
                </Button>
              </div>
              {processing && <div className="mt-4 space-y-2"><Progress value={progress} className="h-2" /><p className="text-xs text-muted-foreground truncate">{message}</p></div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extract */}
        <TabsContent value="extract">
          <Card>
            <CardContent className="p-6">
              {file && !isVideoFile(file) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Please select a video file to extract audio from.</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audio Format</label>
                    <Select value={audioFormat} onValueChange={setAudioFormat}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUDIO_FORMATS.map((f) => <SelectItem key={f} value={f}>.{f.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleProcess} disabled={!file || processing || (file ? !isVideoFile(file) : true)} className="w-full sm:w-auto bg-secondary hover:bg-secondary/90">
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Music className="w-4 h-4 mr-2" />}
                    {processing ? "Extracting..." : "Extract Audio"}
                  </Button>
                </div>
              )}
              {processing && <div className="mt-4 space-y-2"><Progress value={progress} className="h-2" /><p className="text-xs text-muted-foreground truncate">{message}</p></div>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trim */}
        <TabsContent value="trim">
          <Card>
            <CardContent className="p-6">
              {file && duration > 0 ? (
                <div className="space-y-5">
                  {isVideoFile(file) && (
                    <div className="rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
                      <video ref={videoRef} src={URL.createObjectURL(file)} className="w-full max-h-56 object-contain" controls />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Start: {formatTime(startTime)}</span>
                      <span>End: {formatTime(endTime)}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Start Time</label>
                      <Slider value={[startTime]} onValueChange={([v]) => { if (v < endTime) setStartTime(v); }} max={duration} step={0.1} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">End Time</label>
                      <Slider value={[endTime]} onValueChange={([v]) => { if (v > startTime) setEndTime(v); }} max={duration} step={0.1} />
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">Duration: {formatTime(endTime - startTime)}</Badge>
                  </div>
                  <Button onClick={handleProcess} disabled={processing || startTime >= endTime} className="w-full">
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scissors className="w-4 h-4 mr-2" />}
                    {processing ? "Trimming..." : "Trim & Download"}
                  </Button>
                  {processing && <div className="space-y-2"><Progress value={progress} className="h-2" /><p className="text-xs text-muted-foreground truncate">{message}</p></div>}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Scissors className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{file ? "Loading metadata..." : "Upload a file to trim it"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
