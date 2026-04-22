import React, { useState } from 'react';
import { ArrowLeft, MapPin, Activity, CheckCircle, Award, Stethoscope, Info, Volume2, Loader2, StopCircle, Globe, Search, Dna } from 'lucide-react';
import { AnalysisResult } from '../types';
import { generateSpeech, findNearbyVets, searchBreedInfo } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

interface BreedInfoProps {
  data: { analysis: AnalysisResult; image: string } | null;
  onBack: () => void;
}

export const BreedInfo: React.FC<BreedInfoProps> = ({ data, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const [activeTab, setActiveTab] = useState<'details' | 'market' | 'vets'>('details');
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [vetsData, setVetsData] = useState<any>(null);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  if (!data) return null;
  const { analysis, image } = data;

  const handlePlayAudio = async () => {
    if (isPlaying && audioSource) {
      try { audioSource.stop(); } catch(e) {}
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const textToSpeak = `This is a ${analysis.breedName}, a ${analysis.species} breed from ${analysis.origin}. It is primarily used as a ${analysis.utility}. Key traits include: ${analysis.physicalTraits.join(', ')}. ${analysis.identificationReasoning}`;
      
      const audioBufferData = await generateSpeech(textToSpeak);
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      
      // Gemini TTS returns raw PCM 16-bit at 24kHz, not a container format (WAV/MP3).
      // We must manually decode it into an AudioBuffer.
      const pcmData = new Int16Array(audioBufferData);
      const audioBuffer = ctx.createBuffer(1, pcmData.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert Int16 PCM to Float32 [-1.0, 1.0]
      for (let i = 0; i < pcmData.length; i++) {
          channelData[i] = pcmData[i] / 32768.0;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      source.start(0);
      setAudioSource(source);
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play audio:", error);
      alert("Could not generate audio description.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const loadMarketInfo = async () => {
      if (marketData) {
        setActiveTab('market');
        return;
      }
      setActiveTab('market');
      setLoadingExtras(true);
      setExtrasError(null);
      const info = await searchBreedInfo(analysis.breedName);
      if (!info) {
        setExtrasError('Could not fetch market info right now. Please try again.');
      } else {
        setMarketData(info);
      }
      setLoadingExtras(false);
  };

  const loadVets = async () => {
      if (vetsData) {
        setActiveTab('vets');
        return;
      }
      setActiveTab('vets');
      setLoadingExtras(true);
      setExtrasError(null);
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setCurrentCoords({ lat, lng });
              const info = await findNearbyVets(lat, lng);
              if (!info) setExtrasError("Could not find nearby veterinary services right now.");
              else setVetsData(info);
              setLoadingExtras(false);
          }, () => {
              setLoadingExtras(false);
              setExtrasError("Location permission denied. Cannot find nearby vets.");
          });
      } else {
          setLoadingExtras(false);
          setExtrasError("Geolocation not supported.");
      }
  };

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (audioSource) try { audioSource.stop(); } catch (e) {}
      if (audioContext && audioContext.state !== 'closed') {
          audioContext.close().catch(e => console.error("AudioContext close error", e));
      }
    };
  }, [audioSource, audioContext]); 

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors duration-300 pt-16">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 px-4 py-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button 
              onClick={onBack}
              className="flex items-center text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white hidden sm:block">Detailed Breed Analysis</h1>
            <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Image */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden p-2">
              <img 
                src={image} 
                alt={analysis.breedName} 
                className="w-full h-auto rounded-xl object-cover max-h-[500px]"
              />
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
               <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Detection Confidence</h3>
               <div className="flex items-center gap-4">
                 <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div 
                      className={`h-full rounded-full ${analysis.confidence > 80 ? 'bg-emerald-500' : analysis.confidence > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${analysis.confidence}%` }}
                   ></div>
                 </div>
                 <span className="text-2xl font-bold text-slate-800 dark:text-white">{analysis.confidence}%</span>
               </div>
            </div>

            {/* Action Buttons for Grounding */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={loadMarketInfo}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${activeTab === 'market' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'}`}
                >
                    <Globe className="w-6 h-6 text-blue-500" />
                    <span className="text-sm font-bold">News & Market</span>
                </button>
                <button 
                    onClick={loadVets}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${activeTab === 'vets' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700 text-slate-700 dark:text-slate-300'}`}
                >
                    <MapPin className="w-6 h-6 text-red-500" />
                    <span className="text-sm font-bold">Find Vets</span>
                </button>
            </div>
          </div>

          {/* Right Column: Details & Dynamic Content */}
          <div className="lg:col-span-7 space-y-6">
             
             <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 min-h-[600px] transition-colors">
                
                {activeTab === 'details' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${analysis.species === 'Cattle' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'}`}>
                                        {analysis.species}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center">
                                        Verified Breed Profile
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {analysis.breedName}
                                </h1>
                            </div>
                            
                            <button
                                onClick={handlePlayAudio}
                                disabled={isLoadingAudio}
                                className="group relative flex items-center justify-center p-4 rounded-full bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-all active:scale-95"
                                title="Listen to Profile"
                            >
                                {isLoadingAudio ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : isPlaying ? (
                                    <StopCircle className="w-6 h-6" />
                                ) : (
                                    <Volume2 className="w-6 h-6" />
                                )}
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white px-2 py-0.5 rounded">
                                    {isPlaying ? 'Stop' : 'Listen'}
                                </span>
                            </button>
                        </div>

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            
                            {/* Origin Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900 group">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform text-blue-500">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Native Region</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{analysis.origin}</p>
                                </div>
                            </div>

                            {/* Utility Card */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900 group">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform text-emerald-500">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Utility</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{analysis.utility}</p>
                                </div>
                            </div>

                        </div>

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${analysis.breedName} ${analysis.origin}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mb-8 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            View native region on map
                        </a>

                        {/* Reasoning Section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Stethoscope className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Expert Diagnosis</h3>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
                                    <MarkdownRenderer content={analysis.identificationReasoning} />
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-purple-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Distinctive Traits</h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {analysis.physicalTraits.map((trait, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{trait}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'market' && (
                     <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => setActiveTab('details')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                                <Globe className="w-6 h-6 mr-2 text-blue-500" />
                                Market & News
                            </h2>
                        </div>
                        
                        {loadingExtras ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">Searching the web for latest info...</p>
                            </div>
                        ) : marketData ? (
                            <div className="space-y-6">
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <MarkdownRenderer content={marketData.text} />
                                </div>
                                
                                {marketData.sources && marketData.sources.length > 0 && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Sources</h4>
                                        <ul className="space-y-2">
                                            {marketData.sources.map((chunk: any, i: number) => (
                                                <li key={i} className="text-sm truncate">
                                                    <a href={chunk.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                                                        <Search className="w-3 h-3 mr-2" />
                                                        {chunk.web?.title || chunk.web?.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : extrasError ? (
                            <div className="text-center text-red-500 py-12">
                                {extrasError}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                                No recent information found.
                            </div>
                        )}
                     </div>
                )}

                {activeTab === 'vets' && (
                     <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <button onClick={() => setActiveTab('details')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                                <MapPin className="w-6 h-6 mr-2 text-red-500" />
                                Nearby Veterinary Services
                            </h2>
                        </div>

                        {loadingExtras ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">Locating clinics near you...</p>
                            </div>
                        ) : vetsData ? (
                            <div className="space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl p-4 mb-4">
                                    <p className="text-red-800 dark:text-red-300 text-sm mb-3">
                                        Showing results based on your current location.
                                    </p>
                                    {currentCoords && (
                                        <a
                                            href={`https://www.google.com/maps/search/veterinary+clinic/@${currentCoords.lat},${currentCoords.lng},13z`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs font-bold text-red-700 dark:text-red-300 underline"
                                        >
                                            <MapPin className="w-3 h-3 mr-1" />
                                            Open nearby vets on map
                                        </a>
                                    )}
                                </div>
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                     <MarkdownRenderer content={vetsData.text} />
                                </div>
                            </div>
                        ) : extrasError ? (
                             <div className="text-center text-red-500 py-12">
                                {extrasError}
                            </div>
                        ) : (
                             <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                                Could not find nearby veterinary services.
                            </div>
                        )}
                     </div>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};