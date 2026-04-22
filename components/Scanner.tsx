import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertTriangle, Info, MapPin, Activity, ChevronRight, Zap, BrainCircuit, CheckCircle2, Cpu, Loader2, MousePointerClick, Scale, Droplets, Clock, Heart, Filter, Database, Server, Download } from 'lucide-react';
import { analyzeMedia, getBreedDetailsAI } from '../services/geminiService';
import { predictTM, loadTMModel, isModelLoaded, warmupModels, TMPrediction, CATTLE_MODEL_URL, BUFFALO_MODEL_URL } from '../services/tmService';
import { AnalysisResult } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ScannerProps {
  onViewDetails?: (result: AnalysisResult, image: string) => void;
}

// Expanded Static Database for Fast Mode (Offline Knowledge Base)
const BREED_DETAILS_DB: Record<string, Partial<AnalysisResult>> = {
  // Cattle
  'Gir': {
    origin: 'Gujarat (Saurashtra)',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Convex forehead', 'Long pendulous ears', 'Red coat color'],
    identificationReasoning: 'The Gir is a world-renowned milk cattle breed native to the Gir forests. It is known for its distinct appearance with a domed forehead and long ears.',
    milkYield: '1590-3182 kg per lactation',
    weight: '385-545 kg',
    lifespan: '12-15 years',
    temperament: 'Docile'
  },
  'Sahiwal': {
    origin: 'Punjab / Rajasthan',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Reddish dun color', 'Loose skin (Lola)', 'Voluminous hump'],
    identificationReasoning: 'Sahiwal is widely considered the best indigenous dairy breed. They are lethargic, tick-resistant, and have a symmetrical body with loose skin.',
    milkYield: '1400-2500 kg per lactation',
    weight: '400-500 kg',
    lifespan: '15-20 years',
    temperament: 'Lethargic / Calm'
  },
  'Red Sindhi': {
    origin: 'Sindh / Punjab',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Deep red color', 'Compact body', 'Medium size'],
    identificationReasoning: 'Similar to Sahiwal but smaller. Red Sindhi cattle are hardy, resistant to common diseases, and adaptable to various climates.',
    milkYield: '1100-2600 kg per lactation',
    weight: '300-400 kg',
    lifespan: '12-15 years',
    temperament: 'Docile'
  },
  'Tharparkar': {
    origin: 'Rajasthan (Thar Desert)',
    utility: 'Dual Purpose',
    physicalTraits: ['White/Grey color', 'Medium horns', 'Heat tolerant'],
    identificationReasoning: 'Known as "White Sindhi", this breed is highly drought-resistant and can thrive on poor quality fodder in desert conditions.',
    milkYield: '1800-2600 kg per lactation',
    weight: '350-450 kg',
    lifespan: '15-18 years',
    temperament: 'Moderate'
  },
  'Kankrej': {
    origin: 'Gujarat (Rann of Kutch)',
    utility: 'Dual Purpose',
    physicalTraits: ['Lyre-shaped horns', 'Steel grey color', 'Powerful gait'],
    identificationReasoning: 'One of the heaviest Indian breeds. Kankrej cattle are prized for their fast, powerful gait (Sawai Chal) and draft power.',
    milkYield: '1300-1800 kg per lactation',
    weight: '500-600 kg',
    lifespan: '15-20 years',
    temperament: 'Active / Slightly Aggressive'
  },
  'Hariana': {
    origin: 'Haryana / Uttar Pradesh',
    utility: 'Dual Purpose',
    physicalTraits: ['White color', 'Compact build', 'High head carriage'],
    identificationReasoning: 'The premier dual-purpose breed of North India. Bullocks are powerful work animals, and cows are fair milk yielders.',
    milkYield: '1000-1500 kg per lactation',
    weight: '350-450 kg',
    lifespan: '12-15 years',
    temperament: 'Active'
  },
  
  // Buffalo
  'Murrah': {
    origin: 'Haryana / Punjab',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Jet black color', 'Tightly curved horns', 'Short limbs'],
    identificationReasoning: 'The "Black Gold" of India. Murrah is the most productive water buffalo breed, distinguished by its tightly curled horns.',
    milkYield: '1800-3000 kg per lactation',
    weight: '450-700 kg',
    lifespan: '18-22 years',
    temperament: 'Docile'
  },
  'Surti': {
    origin: 'Gujarat',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Sickle shaped horns', 'Two white collars', 'Medium size'],
    identificationReasoning: 'A medium-sized breed from Gujarat. Known for high fat content in milk and very economical food conversion efficiency.',
    milkYield: '1500-1700 kg per lactation',
    weight: '400-500 kg',
    lifespan: '15-20 years',
    temperament: 'Calm'
  },
  'Jaffrabadi': {
    origin: 'Gujarat (Gir Forest)',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Heavy drooping horns', 'Massive forehead', 'Large size'],
    identificationReasoning: 'The heaviest Indian buffalo breed. They are excellent yielders of milk with high fat content, native to the harsh landscapes of Saurashtra.',
    milkYield: '1800-2400 kg per lactation',
    weight: '700-900 kg',
    lifespan: '18-20 years',
    temperament: 'Independent'
  },
  'Nili-Ravi': {
    origin: 'Punjab',
    utility: 'Milch (Dairy)',
    physicalTraits: ['Wall eyes', 'White markings on extremities', 'Black coat'],
    identificationReasoning: 'Known as "Panch Kalyani" due to five white markings. It is very similar to Murrah in production but distinct in appearance.',
    milkYield: '1600-1800 kg per lactation',
    weight: '500-650 kg',
    lifespan: '18-22 years',
    temperament: 'Docile'
  }
};

// Robust mapping to normalize TM Model outputs to DB keys
const MODEL_TO_DB_MAP: Record<string, string> = {
    // Cattle
    'gir': 'Gir', 'gyr': 'Gir', 'gir cow': 'Gir', 'indian gir': 'Gir',
    'sahiwal': 'Sahiwal', 'sahival': 'Sahiwal', 'sahiwal cow': 'Sahiwal',
    'red sindhi': 'Red Sindhi', 'sindhi': 'Red Sindhi', 'redsindhi': 'Red Sindhi', 'red sindhi cow': 'Red Sindhi',
    'tharparkar': 'Tharparkar', 'thari': 'Tharparkar', 'tharparkar cow': 'Tharparkar',
    'kankrej': 'Kankrej', 'kankrej (cow)': 'Kankrej', 'kankrej cow': 'Kankrej',
    'hariana': 'Hariana', 'haryana': 'Hariana', 'hariana cow': 'Hariana',
    
    // Buffalo
    'murrah': 'Murrah', 'murrah buffalo': 'Murrah',
    'surti': 'Surti', 'surti buffalo': 'Surti',
    'jaffrabadi': 'Jaffrabadi', 'jafrabadi': 'Jaffrabadi', 'jafrabadi buffalo': 'Jaffrabadi',
    'nili ravi': 'Nili-Ravi', 'niliravi': 'Nili-Ravi', 'nili-ravi': 'Nili-Ravi', 'nili ravi buffalo': 'Nili-Ravi', 'panch kalyani': 'Nili-Ravi'
};

const normalizeBreedName = (rawName: string): string => {
    const lower = rawName.toLowerCase().trim();
    
    // Direct map check
    if (MODEL_TO_DB_MAP[lower]) return MODEL_TO_DB_MAP[lower];
    
    // Check if map keys are contained in raw name (e.g. "indian gir cow" -> "Gir")
    // Sort keys by length descending to match longest specific phrases first
    const sortedKeys = Object.keys(MODEL_TO_DB_MAP).sort((a, b) => b.length - a.length);
    const mapKey = sortedKeys.find(k => lower.includes(k));
    if (mapKey) return MODEL_TO_DB_MAP[mapKey];

    // Fallback: Check if DB keys are contained in raw name
    const dbKey = Object.keys(BREED_DETAILS_DB).find(k => lower.includes(k.toLowerCase()));
    if (dbKey) return dbKey;

    // Return capitalized raw name if no match
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
};

const getBreedDetails = (breedName: string, species: 'Cattle' | 'Buffalo') => {
    const normalizedKey = normalizeBreedName(breedName);
    
    // Direct lookup in DB
    if (BREED_DETAILS_DB[normalizedKey]) {
        return { ...BREED_DETAILS_DB[normalizedKey], breedName: normalizedKey };
    }

    // Fallback defaults if breed not in DB
    return {
        breedName: normalizedKey,
        origin: 'Indigenous to India',
        utility: species === 'Buffalo' ? 'Milch (Dairy)' : 'Dual Purpose',
        physicalTraits: ['Specific traits require veterinary exam'],
        identificationReasoning: `This appears to be a ${normalizedKey}, a breed of ${species} found in India. Fast mode provides identification based on visual patterns.`,
        milkYield: 'Data unavailable',
        weight: 'Data unavailable',
        lifespan: 'Data unavailable',
        temperament: 'Data unavailable'
    };
};

export const Scanner: React.FC<ScannerProps> = ({ onViewDetails }) => {
  const [media, setMedia] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [filename, setFilename] = useState<string>('');
  
  const [geminiResult, setGeminiResult] = useState<AnalysisResult | null>(null);
  const [tmResult, setTmResult] = useState<AnalysisResult | null>(null);
  const [rawTmPreds, setRawTmPreds] = useState<TMPrediction[] | null>(null);
  
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isTmLoading, setIsTmLoading] = useState(false);
  const [detectedSpecies, setDetectedSpecies] = useState<'Cattle' | 'Buffalo' | 'Unknown'>('Unknown');
  
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'precise' | 'fast'>('precise');
  const [fastModeSpecies, setFastModeSpecies] = useState<'Auto' | 'Cattle' | 'Buffalo'>('Auto');
  
  // Initialize 'loaded' state based on cache check to avoid flickers
  const [tmModelLoaded, setTmModelLoaded] = useState(() => 
     isModelLoaded(CATTLE_MODEL_URL) && isModelLoaded(BUFFALO_MODEL_URL)
  );
  const [tmLoadError, setTmLoadError] = useState<string | null>(null);
  
  const [modelLoadStatus, setModelLoadStatus] = useState<string>('Initializing AI...');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fastAnalysisRunRef = useRef(0);
  const geminiAnalysisRunRef = useRef(0);
  const lastPreciseAnalysisKeyRef = useRef<string>('');
  
  const RADIUS = 18;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  // 1. Load models if not already loaded
  useEffect(() => {
    if (tmModelLoaded) return; // Skip if already loaded from App.tsx

    const initModels = async () => {
        try {
            setModelLoadStatus("Initializing Engines...");
            setLoadingProgress(20);
            
            // This will return instantly if App.tsx has already cached them
            await warmupModels();

            setLoadingProgress(100);
            setTmModelLoaded(true);
            setTmLoadError(null);

        } catch (e: any) {
            console.warn("Model load failed:", e.message);
            let errorMsg = "Fast Mode Unavailable: Failed to load AI models.";
            if (!navigator.onLine) errorMsg = "Fast Mode Unavailable: Internet connection required.";
            setTmModelLoaded(false);
            setTmLoadError(errorMsg);
        }
    };
    initModels();
  }, [tmModelLoaded]);

  // 2. Fast Analysis trigger (TensorFlow.js Teachable Machine — only in Fast mode)
  useEffect(() => {
    if (media && tmModelLoaded && mode === 'fast' && mimeType.startsWith('image')) {
      runFastAnalysis(true);
    }
  }, [media, tmModelLoaded, fastModeSpecies, mode, mimeType]);

  // Prefetch Fast result in background so switching from Precision is instant.
  useEffect(() => {
    if (!media || !tmModelLoaded || !mimeType.startsWith('image')) return;
    if (tmResult || isTmLoading) return;
    runFastAnalysis(false);
  }, [media, tmModelLoaded, mimeType, tmResult, isTmLoading, fastModeSpecies]);

  const processFile = (file: File) => {
    // We use FileReader to get Base64. It is practically instant for local images 
    // and ensures cross-mode compatibility between Fast (TM) and Precise (Gemini).
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      fastAnalysisRunRef.current += 1;
      geminiAnalysisRunRef.current += 1;
      lastPreciseAnalysisKeyRef.current = '';
      setMedia(base64String);
      setMimeType(file.type);
      setFilename(file.name);
      setGeminiResult(null);
      setTmResult(null);
      setRawTmPreds(null);
      setError(null);
      setDetectedSpecies('Unknown');
    };
    reader.readAsDataURL(file);
  };

  const runFastAnalysis = async (isInteractive: boolean = true) => {
      if (!tmModelLoaded || !media) return;
      const runId = ++fastAnalysisRunRef.current;
      
      if (isInteractive) {
          setIsTmLoading(true);
          setError(null);
      }
      
      try {
          const img = new Image();
          img.src = media;
          await img.decode();
          if (runId !== fastAnalysisRunRef.current) return;

          let bestPred: TMPrediction;
          let species: 'Cattle' | 'Buffalo';
          let allPreds: TMPrediction[];

          if (fastModeSpecies === 'Auto') {
            const [cattlePreds, buffaloPreds] = await Promise.all([
                predictTM(img, CATTLE_MODEL_URL),
                predictTM(img, BUFFALO_MODEL_URL)
            ]);
            if (runId !== fastAnalysisRunRef.current) return;
            
            const topCattle = cattlePreds[0];
            const topBuffalo = buffaloPreds[0];
            
            if (topCattle.probability > topBuffalo.probability) {
                bestPred = topCattle;
                species = 'Cattle';
                allPreds = cattlePreds;
            } else {
                bestPred = topBuffalo;
                species = 'Buffalo';
                allPreds = buffaloPreds;
            }
          } else if (fastModeSpecies === 'Cattle') {
              allPreds = await predictTM(img, CATTLE_MODEL_URL);
              if (runId !== fastAnalysisRunRef.current) return;
              bestPred = allPreds[0];
              species = 'Cattle';
          } else {
              allPreds = await predictTM(img, BUFFALO_MODEL_URL);
              if (runId !== fastAnalysisRunRef.current) return;
              bestPred = allPreds[0];
              species = 'Buffalo';
          }

          const normalizedName = normalizeBreedName(bestPred.className);
          bestPred.className = normalizedName;

          const mappedPreds = allPreds.map(p => ({
              ...p,
              className: normalizeBreedName(p.className)
          }));
          setRawTmPreds(mappedPreds);
          setDetectedSpecies(species);

          const details = getBreedDetails(normalizedName, species);
          
          const result: AnalysisResult = {
                breedName: details.breedName || normalizedName,
                confidence: Math.round(bestPred.probability * 100),
                species: species,
                physicalTraits: details.physicalTraits || [],
                identificationReasoning: details.identificationReasoning || '',
                origin: details.origin || 'India',
                utility: details.utility || 'Unknown',
                milkYield: details.milkYield,
                weight: details.weight,
                lifespan: details.lifespan,
                temperament: details.temperament
          };

          setTmResult(result);
          
          if (navigator.onLine) {
              getBreedDetailsAI(normalizedName, species).then(aiDetails => {
                 if (runId !== fastAnalysisRunRef.current) return;
                 if (Object.keys(aiDetails).length > 0) {
                     setTmResult(prev => {
                         if (!prev || prev.breedName !== normalizedName) return prev;
                         return { ...prev, ...aiDetails } as AnalysisResult;
                     });
                 }
              });
          }
      } catch(err: any) {
          console.error("Fast Analysis error:", err);
          if (isInteractive) setError("Fast analysis failed. Please try Precision Mode.");
      } finally {
          if (isInteractive) setIsTmLoading(false);
      }
  };

  const performGeminiAnalysis = async (base64Data: string, type: string) => {
    if (isGeminiLoading || geminiResult) return;
    const runId = ++geminiAnalysisRunRef.current;
    setIsGeminiLoading(true);
    setError(null);
    try {
      const timeoutMs = 45000;
      const analysis = await new Promise<AnalysisResult>((resolve, reject) => {
        const timeoutId = window.setTimeout(
          () => reject(new Error('Precision scan timed out. Please retry or use Fast Mode.')),
          timeoutMs,
        );

        analyzeMedia(base64Data, type, filename)
          .then((value) => {
            window.clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((err) => {
            window.clearTimeout(timeoutId);
            reject(err);
          });
      });
      if (runId !== geminiAnalysisRunRef.current) return;
      setGeminiResult(analysis);
    } catch (err: any) {
      if (runId !== geminiAnalysisRunRef.current) return;
      if (mode === 'precise') {
          const msg = err?.message || "Precision scan failed.";
          setError(`${msg} Showing Fast Mode fallback when available.`);
      }
    } finally {
      if (runId === geminiAnalysisRunRef.current) {
        setIsGeminiLoading(false);
      }
    }
  };

  const requestPreciseAnalysisForCurrentMedia = () => {
    if (!media) return;
    const mediaKey = `${media.length}-${mimeType}-${filename}`;
    if (lastPreciseAnalysisKeyRef.current === mediaKey) return;
    lastPreciseAnalysisKeyRef.current = mediaKey;
    const base64Data = media.split(',')[1];
    if (!base64Data) return;
    performGeminiAnalysis(base64Data, mimeType);
  };

  // Prefetch Precision result in background so switching modes feels instant.
  useEffect(() => {
    if (!media) return;
    if (!(mimeType.startsWith('image') || mimeType.startsWith('video'))) return;
    if (geminiResult || isGeminiLoading) return;
    requestPreciseAnalysisForCurrentMedia();
  }, [media, mimeType, filename, geminiResult, isGeminiLoading]);

  // Safety watchdog: never allow precision loader to spin forever.
  useEffect(() => {
    if (!isGeminiLoading) return;
    const id = window.setTimeout(() => {
      setIsGeminiLoading(false);
      setError('Precision scan took too long. Please retry or use Fast Mode.');
    }, 50000);
    return () => window.clearTimeout(id);
  }, [isGeminiLoading]);

  const handleImageRenderLoad = () => {
      if (mode === 'precise' && media) {
          requestPreciseAnalysisForCurrentMedia();
      }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { 
         setError("File size too large. Please upload an image or video under 15MB.");
         return;
      }
      processFile(file);
    }
  };

  const resetScanner = () => {
    fastAnalysisRunRef.current += 1;
    geminiAnalysisRunRef.current += 1;
    lastPreciseAnalysisKeyRef.current = '';
    setMedia(null);
    setFilename('');
    setGeminiResult(null);
    setTmResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayResult = mode === 'precise' ? (geminiResult || tmResult) : tmResult;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
      
      <div className="flex flex-col items-center mb-6 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 inline-flex relative">
            <div 
                className={`absolute top-1.5 bottom-1.5 rounded-xl bg-emerald-600 transition-all duration-300 ease-in-out shadow-md ${mode === 'precise' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'}`}
            ></div>

            <button 
                onClick={() => setMode('precise')}
                className={`relative z-10 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center transition-colors min-w-[180px] ${mode === 'precise' ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <BrainCircuit className="w-4 h-4 mr-2" />
                Precision Mode
                {geminiResult && mode === 'precise' && <CheckCircle2 className="w-3 h-3 ml-2 text-emerald-200" />}
            </button>
            <button 
                onClick={() => setMode('fast')}
                disabled={!!tmLoadError}
                className={`relative z-10 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center transition-colors min-w-[180px] ${mode === 'fast' ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                title={tmLoadError ? "Model not configured" : "Use local AI"}
            >
                <Zap className="w-4 h-4 mr-2" />
                Fast Mode
                {tmResult && mode === 'fast' && <CheckCircle2 className="w-3 h-3 ml-2 text-emerald-200" />}
            </button>
        </div>
        
        <div className="mt-4 text-center">
             {mode === 'precise' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 animate-in fade-in">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Gemini 3 Pro</span>: Best for detailed veterinary analysis & crossbreed detection.
                </p>
            ) : (
                <div className="flex flex-col items-center animate-in fade-in">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        <span className="font-semibold text-orange-600 dark:text-orange-400">Instant AI</span>: Auto-detecting breed features without network delay.
                    </p>
                </div>
            )}
            
            {tmLoadError && (
                <span className="text-xs text-orange-500 mt-2 flex items-center justify-center bg-orange-50 dark:bg-orange-900/10 px-3 py-1 rounded-full">
                    <Info className="w-3 h-3 mr-1" />
                    {tmLoadError}
                </span>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-slate-950/50 overflow-hidden min-h-[600px] flex flex-col lg:flex-row border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        
        <div className={`lg:w-1/2 p-8 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 ${displayResult || (mode==='fast' && tmResult) ? '' : 'justify-center'} relative transition-colors`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center">
            {mode === 'precise' ? 'Deep Analysis' : 'Rapid Recognition'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {mode === 'precise' ? 'Analyzing uploaded media...' : `Scanning for ${fastModeSpecies} features...`}
          </p>
          
          {!media ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-3xl p-10 bg-white dark:bg-slate-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all duration-300 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="bg-emerald-100/50 dark:bg-emerald-900/30 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-lg text-center mb-2">Upload Image or Video</p>
              <button 
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20"
              >
                Choose File
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
            </div>
          ) : (
            <div className="relative group rounded-3xl overflow-hidden shadow-lg bg-black flex items-center justify-center min-h-[400px]">
              {mimeType.startsWith('video') ? (
                  <video src={media} controls className="w-full h-auto max-h-[600px]" onLoadedData={handleImageRenderLoad} />
              ) : (
                  <img src={media} alt="Uploaded" className="max-w-full max-h-[600px] w-auto h-auto object-contain mx-auto shadow-2xl" onLoad={handleImageRenderLoad} style={{ imageRendering: 'auto' }} />
              )}
              
              <button onClick={resetScanner} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-md z-20">
                <X className="w-5 h-5" />
              </button>
              
              {isGeminiLoading && mode === 'precise' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
                    <div className="relative z-20 flex flex-col items-center">
                        <div className="w-24 h-24 mb-6 relative">
                            <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-b-4 border-emerald-500/30 animate-spin [animation-direction:reverse]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BrainCircuit className="w-10 h-10 text-emerald-400 animate-pulse" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Gemini 3 Pro Analyzing...</h3>
                        <p className="text-emerald-200/80 text-sm">Evaluating Phenotypic Markers</p>
                    </div>
                </div>
              )}
            </div>
          )}
          {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center text-red-700 dark:text-red-300 animate-in slide-in-from-bottom-2">
                  <AlertTriangle className="w-5 h-5 mr-3 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
              </div>
          )}
        </div>

        <div className="lg:w-1/2 p-8 bg-white dark:bg-slate-900 overflow-y-auto max-h-[800px] border-l border-slate-100 dark:border-slate-800 transition-colors">
            
            {mode === 'precise' && (
                <>
                    {isGeminiLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-full inline-block">
                                    <BrainCircuit className="w-12 h-12 text-emerald-500 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">Gemini 3 Pro is Thinking</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm">
                                        Analyzing morphological traits, horn curvature, and skin patterns against Indian bovine database...
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : displayResult ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Standard Header */}
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${displayResult.species === 'Unknown' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                                {displayResult.species} Detected
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 font-medium uppercase">Confidence</div>
                                        <div className={`${getConfidenceColor(displayResult.confidence)} font-bold`}>{displayResult.confidence}%</div>
                                    </div>
                                    <div className="w-14 h-14 relative flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                                            <circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-200 dark:text-slate-700" />
                                            <circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="5" fill="none" className={`${getConfidenceColor(displayResult.confidence)} transition-all duration-1000 ease-out`} strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - (displayResult.confidence / 100) * CIRCUMFERENCE} strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{displayResult.breedName}</h2>
                            <div className="flex items-center text-slate-500 dark:text-slate-400 mb-8 font-medium"><MapPin className="w-5 h-5 mr-2 text-emerald-500" />{displayResult.origin}</div>
                            {(displayResult.milkYield || displayResult.weight) && (
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Droplets className="w-4 h-4 text-blue-500" /> Milk Yield</div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.milkYield || 'N/A'}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Scale className="w-4 h-4 text-orange-500" /> Weight</div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.weight || 'N/A'}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Clock className="w-4 h-4 text-purple-500" /> Lifespan</div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.lifespan || 'N/A'}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Heart className="w-4 h-4 text-red-500" /> Temperament</div>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.temperament || 'N/A'}</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Utility</p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{displayResult.utility}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Species</p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{displayResult.species}</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-900/10 dark:to-slate-900 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900 mb-8">
                                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3 flex items-center"><Activity className="w-4 h-4 mr-2" />AI Reasoning Engine</h3>
                                <div className="text-slate-700 dark:text-slate-300 text-sm leading-7 font-medium"><MarkdownRenderer content={displayResult.identificationReasoning} /></div>
                            </div>
                            {displayResult.species !== 'Unknown' && onViewDetails && media && mimeType.startsWith('image') && (
                                <button onClick={() => onViewDetails(displayResult, media)} className="w-full group flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl">
                                <span className="font-bold">View Full Breed Profile</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border-2 border-slate-100 dark:border-slate-700 group hover:border-emerald-500 transition-all duration-300 cursor-pointer mx-auto" onClick={() => fileInputRef.current?.click()}><MousePointerClick className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" /></div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 capitalize">Auto-Detect Active</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6 text-sm">Upload an image. The AI will automatically distinguish between Cattle and Buffalo.</p>
                        </div>
                    )}
                </>
            )}

            {mode === 'fast' && (
                <>
                    {!tmModelLoaded && !tmLoadError ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
                             <div className="relative mb-8">
                                 <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center"><Download className="w-10 h-10 text-emerald-500/50" /></div>
                                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-100 dark:text-slate-800" />
                                    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" fill="none" className="text-emerald-500 transition-all duration-300 ease-out" strokeDasharray="289" strokeDashoffset={289 - (289 * loadingProgress) / 100} strokeLinecap="round" />
                                 </svg>
                             </div>
                             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Initializing Fast Mode</h3>
                             <div className="h-8 flex items-center justify-center mb-6"><p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">{modelLoadStatus}</p></div>
                             <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                                 <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span className="flex items-center gap-2"><Server className="w-3 h-3" /> TF.js Backend</span>{loadingProgress >= 20 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Loader2 className="w-3 h-3 animate-spin" />}</div>
                                 <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span className="flex items-center gap-2"><Database className="w-3 h-3" /> MobileNet Models</span>{loadingProgress >= 50 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Loader2 className="w-3 h-3 animate-spin" />}</div>
                                 <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> GPU Warmup</span>{loadingProgress >= 90 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Loader2 className="w-3 h-3 animate-spin" />}</div>
                             </div>
                         </div>
                    ) : displayResult && tmResult ? (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
                             <div className="flex items-center justify-between mb-6">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-bold uppercase tracking-wider"><Zap className="w-3 h-3 mr-1" />Offline Mode</div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right"><div className="text-xs text-slate-400 font-medium uppercase">Confidence</div><div className={`${getConfidenceColor(displayResult.confidence)} font-bold`}>{displayResult.confidence}%</div></div>
                                    <div className="w-14 h-14 relative flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                                            <circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="5" fill="none" className="text-slate-200 dark:text-slate-700" />
                                            <circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="5" fill="none" className={`${getConfidenceColor(displayResult.confidence)} transition-all duration-1000 ease-out`} strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE - (displayResult.confidence / 100) * CIRCUMFERENCE} strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                             </div>
                             <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">{displayResult.breedName}</h2>
                             <div className="flex items-center text-slate-500 dark:text-slate-400 mb-8 font-medium"><MapPin className="w-5 h-5 mr-2 text-emerald-500" />{displayResult.origin}</div>
                             <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2"><div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Droplets className="w-4 h-4 text-blue-500" /> Milk Yield</div><span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.milkYield || 'N/A'}</span></div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2"><div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Scale className="w-4 h-4 text-orange-500" /> Weight</div><span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.weight || 'N/A'}</span></div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2"><div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Clock className="w-4 h-4 text-purple-500" /> Lifespan</div><span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.lifespan || 'N/A'}</span></div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-2"><div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Heart className="w-4 h-4 text-red-500" /> Temperament</div><span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{displayResult.temperament || 'N/A'}</span></div>
                             </div>
                             {rawTmPreds && (
                                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4"><h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">Neural Confidence Matches</h4><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">{fastModeSpecies} Mode</span></div>
                                    <div className="space-y-4">
                                        {rawTmPreds.slice(0, 3).map((pred, i) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300"><span>{pred.className}</span><span>{Math.round(pred.probability * 100)}%</span></div>
                                                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${pred.probability * 100}%` }}></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm mb-6 flex items-start"><Info className="w-5 h-5 mr-2 shrink-0" /><p>Result generated by local MobileNetV2 with {displayResult.species} model selected automatically. Breed details fetched from offline database.</p></div>
                             {onViewDetails && media && (<button onClick={() => displayResult && onViewDetails(displayResult, media)} className="w-full group flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"><span className="font-bold">Find Market Info for {displayResult.breedName}</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>)}
                         </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"><BrainCircuit className="w-10 h-10 text-slate-300 dark:text-slate-600" /></div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Precision Mode Active</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">Ready to analyze. Upload an image to start deep veterinary reasoning.</p>
                        </div>
                    )}
                </>
            )}

        </div>
      </div>
    </div>
  );
};