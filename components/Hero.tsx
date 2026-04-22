import React from 'react';
import { PlayCircle, ShieldCheck, Zap, Activity, ScanLine, BrainCircuit } from 'lucide-react';
import { AppView } from '../types';
import { MagicRevealImage } from './hero/MagicRevealImage';

interface HeroProps {
  onChangeView: (view: AppView) => void;
}

export const Hero: React.FC<HeroProps> = ({ onChangeView }) => {
  return (
    <div className="relative overflow-hidden flex flex-col pt-16 pb-16 lg:pb-32">
        <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-8 relative z-10 w-full flex flex-col justify-center">
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center h-full">
                {/* Left Column: Content */}
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col justify-center text-center lg:text-left pt-10 lg:pt-0">
                    <div className="inline-flex items-center gap-2 mb-8 mx-auto lg:mx-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-emerald-200 dark:border-emerald-800/50 px-5 py-2.5 rounded-full shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-shadow">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-800 dark:text-emerald-300 font-bold tracking-widest text-xs uppercase">AI Cattle & Buffalo Breed Intelligence Platform</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[1.05]">
                        <span className="block mb-2">Indian</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 dark:from-emerald-400 dark:to-cyan-300 drop-shadow-sm">
                            Bovine
                        </span>
                        <span className="block mt-2">Identifier</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                        PashuParichay combines local <b>YOLO live detection</b>, <b>segment masks</b>, and <b>Gemini-powered breed insights</b> to deliver fast, explainable identification for field surveys, dairy workflows, and conservation use cases.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 mb-14 justify-center lg:justify-start">
                        <button 
                            onClick={() => onChangeView(AppView.SCANNER)}
                            className="group relative px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30 flex items-center justify-center min-w-[200px]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-white/20 blur-md transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                            <span className="relative flex items-center">
                                <ScanLine className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                                Initiate Scanner
                            </span>
                        </button>
                        <button 
                            onClick={() => onChangeView(AppView.YOLO_SEGMENT)}
                            className="px-8 py-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-2xl font-bold text-lg transition-all hover:bg-white dark:hover:bg-slate-800 flex items-center justify-center hover:border-emerald-400 dark:hover:border-emerald-500 group min-w-[200px] shadow-sm hover:shadow-md"
                        >
                            <PlayCircle className="w-6 h-6 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                            YOLO Vision
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-3 text-sm text-slate-600 dark:text-slate-400 font-semibold mb-10">
                        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 group hover:border-emerald-500/50 transition-colors">
                            <BrainCircuit className="w-5 h-5 text-emerald-500" />
                            <span>High-accuracy breed recognition</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 group hover:border-amber-500/50 transition-colors">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <span>YOLO live camera + segmentation</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 group hover:border-sky-500/50 transition-colors">
                            <ShieldCheck className="w-5 h-5 text-sky-500" />
                            <span>Species classification + AI details</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 group hover:border-fuchsia-500/50 transition-colors">
                            <Activity className="w-5 h-5 text-fuchsia-500" />
                            <span>Technical docs + validated metrics</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Premium UI Composition */}
                <div className="relative flex items-center justify-center h-[500px] lg:h-[600px] w-full animate-in fade-in slide-in-from-right-12 duration-1000 delay-200 lg:translate-x-10 mt-10 lg:mt-0 perspective-1000">
                    
                    {/* Glowing Aura behind the cards */}
                    <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-emerald-400/40 via-teal-400/30 to-sky-400/20 dark:from-emerald-600/30 dark:via-teal-600/20 dark:to-cyan-600/20 rounded-[100px] blur-[80px] animate-pulse-slow"></div>

                    {/* Floating Hero Composition */}
                    <div className="relative w-full max-w-lg h-full flex items-center justify-center transform-style-3d">
                        
                        {/* Main Glass Card */}
                        <div className="absolute z-20 w-[90%] md:w-[400px] h-[480px] bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform -rotate-2 hover:rotate-0 transition-transform duration-500 ease-out overflow-hidden flex flex-col items-center justify-center p-6 group">
                            <div className="absolute top-4 left-6 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            
                            <MagicRevealImage />

                            <div className="w-full mt-6">
                                <div className="relative h-12 w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-center justify-center px-4 overflow-hidden">
                                    <div className="absolute inset-0 opacity-60 pointer-events-none">
                                        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(16,185,129,0.18),transparent)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000 ease-out" />
                                    </div>
                                    <div className="relative flex items-center gap-2.5">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
                                        </span>
                                        <span className="text-[11px] font-mono text-emerald-900 dark:text-emerald-200 font-bold uppercase tracking-widest">
                                            Hover to compare cattle ↔ buffalo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Back Floating Card 1 */}
                        <div className="absolute z-10 w-[70%] md:w-[320px] h-[360px] bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-3xl shadow-xl transform rotate-[12deg] translate-x-20 -translate-y-10 opacity-80 backdrop-blur-md"></div>
                        
                        {/* Back Floating Card 2 */}
                        <div className="absolute z-0 w-[60%] md:w-[280px] h-[340px] bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-3xl shadow-lg transform -rotate-[15deg] -translate-x-20 translate-y-12 opacity-60 backdrop-blur-sm"></div>

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};