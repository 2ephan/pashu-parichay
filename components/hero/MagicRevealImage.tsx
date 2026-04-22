import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

export const MagicRevealImage = memo(() => {
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const revealLayerRef = useRef<HTMLDivElement>(null);
  const trackingRingRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const trkRef = useRef<HTMLSpanElement>(null);
  const maskPositionRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number | null>(null);

  const flushPosition = useCallback(() => {
    rafRef.current = null;
    const { x, y } = maskPositionRef.current;

    if (revealLayerRef.current) {
      const clip = `circle(58px at ${x}px ${y}px)`;
      revealLayerRef.current.style.webkitClipPath = clip;
      revealLayerRef.current.style.clipPath = clip;
    }
    if (trackingRingRef.current) {
      trackingRingRef.current.style.left = `${x - 58}px`;
      trackingRingRef.current.style.top = `${y - 58}px`;
    }
    if (hubRef.current) {
      hubRef.current.style.left = `${x}px`;
      hubRef.current.style.top = `${y}px`;
    }
    if (trkRef.current) {
      trkRef.current.textContent = `TRK_${Math.round(x)}`;
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(flushPosition);
  }, [flushPosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    maskPositionRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    scheduleFlush();
  };

  useEffect(() => {
    flushPosition();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [flushPosition]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full aspect-square border-2 border-emerald-500/20 rounded-lg flex items-center justify-center mb-6 overflow-hidden bg-slate-900 isolate cursor-none group/reveal shadow-2xl"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

      <img src="/cow.jpg" alt="Uploaded Cow" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover z-10" />

      <div
        className={`absolute inset-0 bg-[linear-gradient(to_bottom,transparent_48%,rgba(16,185,129,0.3)_50%,transparent_52%)] bg-[length:100%_4px] animate-scan z-20 pointer-events-none transition-opacity duration-300 ${
          isHovering ? 'opacity-20' : 'opacity-60'
        }`}
      />

      <div
        ref={revealLayerRef}
        className={`absolute inset-0 z-30 w-full h-full pointer-events-none overflow-hidden transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
      >
        <img src="/buffalo.jpg" alt="Uploaded Buffalo" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover scale-105" />

        <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(52,211,153,0.05)_0px,rgba(52,211,153,0.05)_1px,transparent_1px,transparent_2px)] pointer-events-none opacity-30" />

        <div
          ref={trackingRingRef}
          className="absolute rounded-full border-2 border-emerald-400/80 shadow-[0_0_18px_rgba(52,211,153,0.32)] pointer-events-none"
          style={{
            width: 116,
            height: 116,
          }}
        >
          <div className="absolute inset-[-6px] border border-emerald-400/20 rounded-full animate-[spin_15s_linear_infinite]" />
          <div className="absolute inset-0 rounded-full border border-emerald-400/10 animate-[ping_3s_linear_infinite]" />
        </div>
      </div>

      <div className={`absolute inset-0 z-40 pointer-events-none transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
        <div ref={hubRef} className="absolute flex items-center justify-center">
          <div className="w-12 h-12 border border-emerald-400/20 rounded-full animate-pulse" />

          <div className="absolute left-6 top-6 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-lg border border-emerald-500/35 whitespace-nowrap shadow-xl min-w-[155px]">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-emerald-500/20">
              <p className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                PASHU_SCAN_V2
              </p>
              <p className="text-[7px] font-mono text-emerald-500/40">REG:9932</p>
            </div>

            <div className="mb-1.5">
              <p className="text-[11px] font-mono text-white leading-tight uppercase font-bold tracking-tight">
                Murrah <span className="text-emerald-400">Buffalo</span>
              </p>
            </div>

            <div className="flex gap-3 mb-1.5">
              <div>
                <p className="text-[7px] font-mono text-emerald-500/50 uppercase">BPM</p>
                <p className="text-[9px] font-mono text-emerald-300">58</p>
              </div>
              <div>
                <p className="text-[7px] font-mono text-emerald-500/50 uppercase">Core_T</p>
                <p className="text-[9px] font-mono text-emerald-300">38.4°C</p>
              </div>
              <div>
                <p className="text-[7px] font-mono text-emerald-500/50 uppercase">mAP50</p>
                <p className="text-[9px] font-mono text-emerald-400">90.9%</p>
              </div>
            </div>

            <div className="flex gap-0.5 h-1 w-full bg-emerald-950/40 rounded-full overflow-hidden mb-1.5">
              {[1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1].map((v, i) => (
                <div key={i} className={`flex-1 ${v ? 'bg-emerald-500/60' : 'bg-transparent'}`} />
              ))}
            </div>

            <div className="flex justify-between items-center text-[7px] font-mono text-emerald-500/40 italic">
              <span>LOC: 28.61N 77.20E</span>
              <span ref={trkRef} className="text-emerald-500/20">
                TRK_0
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 border-[10px] border-slate-900/40 z-50 pointer-events-none" />
      <div className="absolute inset-0 border border-emerald-500/20 z-50 pointer-events-none rounded-xl" />
    </div>
  );
});
