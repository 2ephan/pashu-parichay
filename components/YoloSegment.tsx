import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, UploadCloud, Play, Square, Layers, Scan, Info, WifiOff, Wifi, Radar } from 'lucide-react';
import { getBreedDetailsAI } from '../services/geminiService';
import { runYoloSegment, pingYoloServer, YoloDetection } from '../services/yoloSegmentService';
import { AnalysisResult } from '../types';

const LIVE_SCAN_MS = 700;
const MIN_AUTO_CONF = 0.42;
const MIN_DRAW_CONF = 0.24;
const MIN_CONFIRM_TICKS = 2;
const JPEG_QUAL = 0.74;
const MAX_CARDS = 6;

type Species = 'Cattle' | 'Buffalo' | 'Unknown';

type DetectedCard = {
  id: string;
  name: string;
  species: Species;
  confidence: number;
  details?: Partial<AnalysisResult>;
};

const normalizeConf = (c: number) => (c > 1 ? c / 100 : c);

const inferSpecies = (label: string): Species => {
  const s = label.toLowerCase();
  if (s.includes('buffalo') || s.includes('murrah') || s.includes('nili') || s.includes('surti') || s.includes('mehsana') || s.includes('jaffar')) return 'Buffalo';
  if (s.includes('cow') || s.includes('cattle') || s.includes('bull') || s.includes('heifer') || s.includes('calf')) return 'Cattle';
  // Most labels in this model are cattle breeds by default.
  return 'Cattle';
};

const dedupeDetections = (detections: YoloDetection[]): YoloDetection[] => {
  const byClass = new Map<string, YoloDetection>();
  for (const d of detections) {
    const k = d.class_name?.trim() || 'Unknown';
    const existing = byClass.get(k);
    if (!existing || normalizeConf(d.confidence) > normalizeConf(existing.confidence)) {
      byClass.set(k, d);
    }
  }
  return [...byClass.values()]
    .sort((a, b) => normalizeConf(b.confidence) - normalizeConf(a.confidence))
    .slice(0, MAX_CARDS);
};

export const YoloSegment: React.FC = () => {
  const [mode, setMode] = useState<'upload' | 'live'>('live');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedCard[]>([]);
  const [yoloServerOk, setYoloServerOk] = useState<boolean | null>(null);
  const [liveFrozen, setLiveFrozen] = useState(false);
  const [liveAutoPause, setLiveAutoPause] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderLoopRef = useRef<number | null>(null);
  const liveScanIntervalRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);
  const liveFrozenRef = useRef(false);
  const isStreamingRef = useRef(false);
  const liveScanBusyRef = useRef(false);
  const lastLiveDetectionsRef = useRef<YoloDetection[]>([]);
  const detailsCacheRef = useRef<Map<string, Partial<AnalysisResult>>>(new Map());
  const stableCandidateRef = useRef<{ label: string; count: number }>({ label: '', count: 0 });
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    liveFrozenRef.current = liveFrozen;
  }, [liveFrozen]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (uploadObjectUrlRef.current) {
        URL.revokeObjectURL(uploadObjectUrlRef.current);
        uploadObjectUrlRef.current = null;
      }
    };
  }, []);

  const clearLiveScanInterval = useCallback(() => {
    if (liveScanIntervalRef.current != null) {
      window.clearInterval(liveScanIntervalRef.current);
      liveScanIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    pingYoloServer().then((ok) => {
      if (!cancelled) setYoloServerOk(ok);
    });
    const id = window.setInterval(() => {
      pingYoloServer().then((ok) => {
        if (!cancelled) setYoloServerOk(ok);
      });
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const stopCamera = useCallback(() => {
    clearLiveScanInterval();
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
    stableCandidateRef.current = { label: '', count: 0 };
    lastLiveDetectionsRef.current = [];
    isAnalyzingRef.current = false;
    liveFrozenRef.current = false;
    setLiveFrozen(false);
    setIsStreaming(false);
  }, [clearLiveScanInterval]);

  const startCamera = async () => {
    setDetectedItems([]);
    setLiveFrozen(false);
    stableCandidateRef.current = { label: '', count: 0 };
    lastLiveDetectionsRef.current = [];
    liveFrozenRef.current = false;
    clearLiveScanInterval();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplay = () => {
          setIsStreaming(true);
          startLiveOverlay();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please ensure camera permissions are granted.');
    }
  };

  useEffect(() => {
    stopCamera();
    return () => stopCamera();
  }, [mode, stopCamera]);

  const hydrateDetails = useCallback(async (cards: DetectedCard[]) => {
    const withCached = cards.map((c) => ({ ...c, details: detailsCacheRef.current.get(c.id) }));
    setDetectedItems(withCached);

    await Promise.all(
      withCached.map(async (card) => {
        if (card.details) return;
        try {
          const details = await getBreedDetailsAI(card.name, card.species);
          detailsCacheRef.current.set(card.id, details);
          setDetectedItems((prev) => prev.map((p) => (p.id === card.id ? { ...p, details } : p)));
        } catch (e) {
          console.error('Details lookup failed', e);
        }
      }),
    );
  }, []);

  const toCards = useCallback((detections: YoloDetection[]): DetectedCard[] => {
    return dedupeDetections(detections).map((d) => {
      const conf = Math.round(normalizeConf(d.confidence) * 100);
      const species = inferSpecies(d.class_name);
      return {
        id: `${d.class_name.toLowerCase()}-${species.toLowerCase()}`,
        name: d.class_name,
        species,
        confidence: conf,
      };
    });
  }, []);

  const drawPredictions = useCallback(
    (ctx: CanvasRenderingContext2D, detections: YoloDetection[], width: number, height: number, clear = true) => {
      if (clear) ctx.clearRect(0, 0, width, height);
      if (!detections.length) return;

      for (const det of detections) {
        const [a, b, c, d] = det.box as number[];
        const maxCoord = Math.max(a, b, c, d);

        let x1: number, y1: number, x2: number, y2: number;
        if (maxCoord <= 1) {
          const ymin = a;
          const xmin = b;
          const ymax = c;
          const xmax = d;
          x1 = xmin * width;
          y1 = ymin * height;
          x2 = xmax * width;
          y2 = ymax * height;
        } else {
          x1 = a;
          y1 = b;
          x2 = c;
          y2 = d;
        }

        const conf = Math.round(normalizeConf(det.confidence) * 100);
        const species = inferSpecies(det.class_name);

        const polygon = det.polygon as [number, number][] | undefined;
        if (polygon && polygon.length >= 3) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
          ctx.beginPath();
          ctx.moveTo(polygon[0][0], polygon[0][1]);
          for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0], polygon[i][1]);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

        const text = `${det.class_name} (${species}) ${conf}%`;
        ctx.font = 'bold 15px Inter, sans-serif';
        const tw = ctx.measureText(text).width;
        const boxY = y1 < 28 ? y1 : y1 - 26;
        const labelY = y1 < 28 ? y1 + 18 : y1 - 8;

        ctx.fillStyle = '#10b981';
        ctx.fillRect(x1, boxY, tw + 14, 24);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x1 + 7, labelY);
      }
    },
    [],
  );

  const startLiveOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }

    let scanY = 0;
    let scanDir = 1;

    const render = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v?.srcObject || !c) return;

      if (!v.videoWidth) {
        renderLoopRef.current = requestAnimationFrame(render);
        return;
      }

      if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }

      ctx.clearRect(0, 0, c.width, c.height);

      if (lastLiveDetectionsRef.current.length > 0) {
        drawPredictions(ctx, lastLiveDetectionsRef.current, c.width, c.height, false);
      }

      if (!isAnalyzingRef.current && !liveFrozenRef.current) {
        scanY += 3 * scanDir;
        if (scanY > c.height) scanDir = -1;
        if (scanY < 0) scanDir = 1;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fillRect(0, scanY, c.width, 2);
      }

      renderLoopRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const resumeLiveScanning = useCallback(() => {
    setDetectedItems([]);
    setLiveFrozen(false);
    liveFrozenRef.current = false;
    stableCandidateRef.current = { label: '', count: 0 };
    const v = videoRef.current;
    if (v) void v.play();
  }, []);

  const runLiveAutoTick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.srcObject || !canvas || liveScanBusyRef.current) return;
    if (liveFrozenRef.current || !isStreamingRef.current || isAnalyzingRef.current) return;
    if (!video.videoWidth || !video.videoHeight) return;

    liveScanBusyRef.current = true;
    const prevIsAnalyzing = isAnalyzingRef.current;
    isAnalyzingRef.current = true;

    try {
      const off = frameCanvasRef.current ?? document.createElement('canvas');
      frameCanvasRef.current = off;
      off.width = video.videoWidth;
      off.height = video.videoHeight;
      off.getContext('2d')?.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => off.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUAL));
      if (!blob || !videoRef.current?.srcObject) return;

      const predictions = await runYoloSegment(blob);
      const raw = predictions?.detections ?? [];
      const deduped = dedupeDetections(raw);

      lastLiveDetectionsRef.current = deduped.filter((d) => normalizeConf(d.confidence) >= MIN_DRAW_CONF);

      const strongest = deduped[0];
      if (!strongest || normalizeConf(strongest.confidence) < MIN_AUTO_CONF) {
        stableCandidateRef.current = { label: '', count: 0 };
        return;
      }

      const label = strongest.class_name.toLowerCase();
      if (stableCandidateRef.current.label === label) {
        stableCandidateRef.current.count += 1;
      } else {
        stableCandidateRef.current = { label, count: 1 };
      }

      if (stableCandidateRef.current.count < MIN_CONFIRM_TICKS || !liveAutoPause) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      video.pause();
      setLiveFrozen(true);
      liveFrozenRef.current = true;
      clearLiveScanInterval();

      const confirmed = deduped.filter((d) => normalizeConf(d.confidence) >= MIN_AUTO_CONF);
      lastLiveDetectionsRef.current = confirmed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPredictions(ctx, confirmed, canvas.width, canvas.height, false);
      await hydrateDetails(toCards(confirmed));
    } catch (e) {
      console.error(e);
    } finally {
      isAnalyzingRef.current = prevIsAnalyzing;
      liveScanBusyRef.current = false;
    }
  }, [clearLiveScanInterval, drawPredictions, hydrateDetails, liveAutoPause, toCards]);

  useEffect(() => {
    if (mode !== 'live' || !isStreaming || liveFrozen || !liveAutoPause) {
      clearLiveScanInterval();
      return;
    }

    liveScanIntervalRef.current = window.setInterval(() => {
      void runLiveAutoTick();
    }, LIVE_SCAN_MS);

    return clearLiveScanInterval;
  }, [mode, isStreaming, liveFrozen, liveAutoPause, runLiveAutoTick, clearLiveScanInterval]);

  const captureAndAnalyzeLiveFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearLiveScanInterval();

    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    video.pause();

    const off = frameCanvasRef.current ?? document.createElement('canvas');
    frameCanvasRef.current = off;
    off.width = video.videoWidth;
    off.height = video.videoHeight;
    off.getContext('2d')?.drawImage(video, 0, 0);

    off.toBlob(async (blob) => {
      try {
        if (!blob) {
          void video.play();
          return;
        }

        const predictions = await runYoloSegment(blob);
        const deduped = dedupeDetections(predictions?.detections ?? []);
        lastLiveDetectionsRef.current = deduped;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (deduped.length > 0) {
          drawPredictions(ctx, deduped, canvas.width, canvas.height, false);
          setLiveFrozen(true);
          liveFrozenRef.current = true;
          await hydrateDetails(toCards(deduped));
        } else {
          setDetectedItems([]);
          setLiveFrozen(false);
          liveFrozenRef.current = false;
          void video.play();
        }
      } catch (e) {
        console.error(e);
        setLiveFrozen(false);
        liveFrozenRef.current = false;
        void video.play();
      } finally {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
      }
    }, 'image/jpeg', JPEG_QUAL);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadObjectUrlRef.current) {
      URL.revokeObjectURL(uploadObjectUrlRef.current);
      uploadObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    uploadObjectUrlRef.current = url;
    setSelectedImage(url);
    setDetectedItems([]);
    setLiveFrozen(false);

    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      isAnalyzingRef.current = true;
      setIsAnalyzing(true);

      try {
        const predictions = await runYoloSegment(file);
        const deduped = dedupeDetections(predictions?.detections ?? []);
        ctx.drawImage(img, 0, 0);

        if (deduped.length > 0) {
          drawPredictions(ctx, deduped, canvas.width, canvas.height, false);
          await hydrateDetails(toCards(deduped));
        } else {
          setDetectedItems([]);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, 0, canvas.width, 60);
          ctx.fillStyle = 'white';
          ctx.font = '20px Inter';
          ctx.fillText('No breed detections in this image.', 20, 36);
        }
      } catch (err) {
        console.error(err);
      }

      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    };

    img.onerror = () => {
      if (uploadObjectUrlRef.current === url) {
        URL.revokeObjectURL(url);
        uploadObjectUrlRef.current = null;
      }
      setSelectedImage(null);
      setDetectedItems([]);
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    };

    img.src = url;
  };

  const clearImage = () => {
    if (uploadObjectUrlRef.current) {
      URL.revokeObjectURL(uploadObjectUrlRef.current);
      uploadObjectUrlRef.current = null;
    }
    setSelectedImage(null);
    setDetectedItems([]);
    isAnalyzingRef.current = false;
    setIsAnalyzing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 relative z-10 w-full h-full min-h-screen flex flex-col">
      {yoloServerOk === false && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-950 dark:text-amber-100">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p className="font-bold">YOLO API not reachable</p>
            <p className="opacity-90">
              Run <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">npm run dev:stack</code> from the project root (starts web + YOLO together).
            </p>
          </div>
        </div>
      )}

      {yoloServerOk === true && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
          <Wifi className="w-4 h-4" /> YOLO server connected
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Layers className="w-10 h-10 text-emerald-500" />
            YOLO Vision <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-md font-bold dark:bg-emerald-900 dark:text-emerald-300">LOCAL</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">
            Live traffic-camera style detection: continuous boxes + breed names. Auto-pause only after a stable confident hit.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex">
          <button
            onClick={() => setMode('live')}
            className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center transition-all ${
              mode === 'live' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Camera className="w-5 h-5 mr-2" /> Live Scanner
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center transition-all ${
              mode === 'upload' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <UploadCloud className="w-5 h-5 mr-2" /> Image Upload
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-grow bg-black/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl relative min-h-[500px] flex items-center justify-center border border-slate-700 dark:border-slate-800 ring-1 ring-emerald-500/20">
          {mode === 'live' && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-auto max-h-[600px] object-cover transition-opacity duration-300 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" />

              <div
                className={`absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 ${
                  isStreaming ? 'bg-black/40 border-emerald-500/30 text-emerald-400' : 'bg-black/60 border-slate-700 text-slate-400 opacity-0'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    liveFrozen ? 'bg-sky-400' : isStreaming && !isAnalyzing ? 'bg-emerald-500 animate-pulse' : isAnalyzing ? 'bg-amber-500 animate-bounce' : 'bg-slate-500'
                  }`}
                />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  {isAnalyzing ? 'Running YOLO…' : liveFrozen ? 'Paused · confirmed' : isStreaming && liveAutoPause ? 'Live detect' : isStreaming ? 'Live' : 'Offline'}
                </span>
              </div>

              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 backdrop-blur-sm">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
                    <Camera className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Live Vision Ready</h3>
                  <p className="text-slate-400 mb-8 max-w-sm text-center">
                    Starts real-time detection overlays, and pauses only when breed detection is stable and confident.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transform duration-200"
                  >
                    <Play className="w-6 h-6 mr-3" /> Start camera
                  </button>
                </div>
              )}

              {isStreaming && !liveFrozen && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 z-30 max-w-[95vw]">
                  <button
                    type="button"
                    onClick={() => setLiveAutoPause((v) => !v)}
                    className={`px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 border transition-all ${
                      liveAutoPause
                        ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                        : 'bg-black/40 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Radar className={`w-5 h-5 ${liveAutoPause ? 'animate-pulse' : ''}`} />
                    Auto-pause {liveAutoPause ? 'on' : 'off'}
                  </button>

                  <button
                    onClick={captureAndAnalyzeLiveFrame}
                    disabled={isAnalyzing}
                    className={`px-8 py-4 ${
                      isAnalyzing ? 'bg-emerald-700 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]'
                    } text-white font-bold rounded-2xl flex items-center transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]`}
                  >
                    <Scan className={`w-6 h-6 mr-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    {isAnalyzing ? 'Analyzing…' : 'Scan frame now'}
                  </button>

                  <button
                    onClick={stopCamera}
                    className="px-6 py-4 bg-slate-800/80 backdrop-blur hover:bg-red-500 text-white font-bold rounded-2xl flex items-center transition-all"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </div>
              )}

              {liveFrozen && detectedItems.length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                  <button onClick={resumeLiveScanning} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center transition-all shadow-lg">
                    <Camera className="w-5 h-5 mr-3" /> Continue live
                  </button>
                </div>
              )}
            </>
          )}

          {mode === 'upload' && (
            <>
              {selectedImage && <img src={selectedImage} alt="Upload preview" className="absolute inset-0 z-0 h-full w-full object-contain" />}
              <canvas ref={canvasRef} className="absolute inset-0 z-10 h-full w-full object-contain pointer-events-none" />

              {!selectedImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm z-20 group cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 bg-emerald-500/10 group-hover:bg-emerald-500/30 ring-4 ring-emerald-500/10 rounded-full flex items-center justify-center mb-6 transition-all duration-300">
                    <UploadCloud className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">Upload cattle/buffalo image</h3>
                  <p className="text-slate-400 mb-8 max-w-sm text-center">YOLO will detect breeds, draw masks/boxes, and fetch additional AI details.</p>
                  <button className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold group-hover:bg-emerald-500/20 transition-colors">Select From Device</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>
              ) : (
                <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
                  {isAnalyzing && (
                    <div className="bg-emerald-500/20 backdrop-blur border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center animate-pulse">
                      <Scan className="w-4 h-4 mr-2 animate-spin" /> Detecting targets…
                    </div>
                  )}
                  <button disabled={isAnalyzing} onClick={clearImage} className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-colors">
                    Reset image
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {detectedItems.length > 0 && (
          <div className="lg:w-96 flex flex-col gap-4 animate-in slide-in-from-right-8">
            <div className="bg-emerald-900/20 backdrop-blur border border-emerald-500/30 rounded-2xl p-6 text-emerald-100 flex items-start gap-4 shadow-lg shadow-emerald-500/5">
              <Info className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg mb-1">Live detection summary</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Confirmed <strong>{detectedItems.length}</strong> unique breed detections. Species (cattle or buffalo) and AI detail cards are shown below.
                </p>
              </div>
            </div>

            {detectedItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{item.name}</h3>
                    <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mt-1">{item.species}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-inner whitespace-nowrap">
                    {item.confidence}%
                  </span>
                </div>

                {item.details ? (
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300 text-sm italic">"{item.details.identificationReasoning || 'AI notes unavailable.'}"</p>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Origin</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.details.origin || 'Unknown'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Utility</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.details.utility || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Weight</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.details.weight || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                        <span className="block text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Milk Yield</span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{item.details.milkYield || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse flex flex-col gap-3 mt-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl w-full mt-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
