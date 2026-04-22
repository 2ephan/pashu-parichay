import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 py-8 mt-auto transition-colors duration-300 relative z-20 w-full shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-5px_30px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="mb-2 text-lg text-emerald-600 dark:text-emerald-500 font-bold tracking-tight">PashuParichay</p>
        <p className="text-sm text-slate-500/80 dark:text-slate-400/80 mb-5">Smart India Hackathon Solution Concept • 2026</p>
        
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-5 text-[11px] text-slate-500/80 dark:text-slate-500/70 font-bold">
            <span>Gemini when you use chat / breed details</span>
            <span className="hidden md:inline text-slate-400/30">•</span>
            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-emerald-900/10 px-2.5 py-1 rounded border border-slate-200 dark:border-emerald-800/30 shadow-inner">
                Local YOLO
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest">model/best.pt</span>
            </span>
            <span className="hidden md:inline text-slate-400/30">•</span>
            <span>Teachable Machine + Google GenAI SDK</span>
        </div>
      </div>
    </footer>
  );
};