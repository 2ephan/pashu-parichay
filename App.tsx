import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppView, AnalysisResult } from './types';
import { warmupModels } from './services/tmService';
import { motion, AnimatePresence } from 'motion/react';

const Hero = lazy(() => import('./components/Hero').then((m) => ({ default: m.Hero })));
const Scanner = lazy(() => import('./components/Scanner').then((m) => ({ default: m.Scanner })));
const TechnicalDocs = lazy(() => import('./components/TechnicalDocs').then((m) => ({ default: m.TechnicalDocs })));
const BreedInfo = lazy(() => import('./components/BreedInfo').then((m) => ({ default: m.BreedInfo })));
const ChatBot = lazy(() => import('./components/ChatBot').then((m) => ({ default: m.ChatBot })));
const LiveAssistant = lazy(() => import('./components/LiveAssistant').then((m) => ({ default: m.LiveAssistant })));
const YoloSegment = lazy(() => import('./components/YoloSegment').then((m) => ({ default: m.YoloSegment })));

const ViewFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-emerald-700 dark:text-emerald-400">
    <div
      className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
      aria-hidden
    />
    <p className="text-sm font-medium opacity-80">Loading…</p>
  </div>
);

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (prefersReducedMotion || isCoarsePointer) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let isHovering = false;
    let ringScale = 1;
    let dotScale = 1;
    let lastHovering: boolean | null = null;
    let hasMoved = false;
    let animationFrameId: number;

    const interactiveSelector =
      'button, a, input, select, textarea, summary, label, [role="button"], [tabindex], [data-cursor-hover="true"], .cursor-pointer, [onclick]';

    const isInteractiveTarget = (el: Element | null) => {
      if (!el) return false;
      const directMatch = el.matches(interactiveSelector) || !!el.closest(interactiveSelector);
      if (directMatch) return true;
      const target = el as HTMLElement;
      const classText = target.className || '';
      if (typeof classText === 'string' && (classText.includes('hover:') || classText.includes('group-hover:'))) {
        return true;
      }
      // React click handlers often render as plain divs; catch typical interactive containers.
      if (typeof (target as any).onclick === 'function') return true;
      return false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!hasMoved) {
        hasMoved = true;
        if (cursorRef.current) cursorRef.current.style.opacity = '1';
        if (dotRef.current) dotRef.current.style.opacity = '1';
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Use elementFromPoint for reliable hover state across nested/transformed elements.
      const elAtPointer = document.elementFromPoint(mouseX, mouseY);
      isHovering = isInteractiveTarget(elAtPointer);
    };

    const render = () => {
      outlineX += (mouseX - outlineX) * 0.15;
      outlineY += (mouseY - outlineY) * 0.15;

      const targetRingScale = isHovering ? 0 : 1;
      const targetDotScale = isHovering ? 7 : 1;

      ringScale += (targetRingScale - ringScale) * 0.15;
      dotScale += (targetDotScale - dotScale) * 0.15;

      if (cursorRef.current && dotRef.current && iconRef.current) {
        cursorRef.current.style.transform = `translate3d(${outlineX - 16}px, ${outlineY - 16}px, 0) scale(${ringScale})`;
        dotRef.current.style.transform = `translate3d(${mouseX - 6}px, ${mouseY - 6}px, 0) scale(${dotScale})`;

        if (lastHovering !== isHovering) {
          lastHovering = isHovering;
          if (isHovering) {
            dotRef.current.style.backgroundColor = 'rgba(2, 44, 34, 0.35)';
            dotRef.current.style.border = '1px solid rgba(52, 211, 153, 0.7)';
            dotRef.current.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.25)';
            iconRef.current.style.opacity = '1';
            iconRef.current.style.transform = 'scale(1) rotate(0deg)';
          } else {
            dotRef.current.style.backgroundColor = 'rgba(52, 211, 153, 1)';
            dotRef.current.style.border = '0px solid transparent';
            dotRef.current.style.boxShadow = '0 0 6px rgba(52, 211, 153, 0.6)';
            iconRef.current.style.opacity = '0';
            iconRef.current.style.transform = 'scale(0.5) rotate(-10deg)';
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    render();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border-[1.5px] border-emerald-500/50 pointer-events-none z-[9999] will-change-transform opacity-0 transition-opacity duration-500 box-border"
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 flex items-center justify-center rounded-full pointer-events-none z-[10000] will-change-transform opacity-0 box-border"
        style={{
          transition:
            'opacity 0.5s, background-color 0.25s ease, box-shadow 0.25s ease, border 0.25s ease',
        }}
      >
        <div
          ref={iconRef}
          className="absolute inset-0 w-full h-full text-emerald-500 will-change-transform transition-all duration-500 ease-out flex items-center justify-center pointer-events-none opacity-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[88%] h-[88%] text-emerald-300 drop-shadow-[0_0_3px_rgba(110,231,183,0.95)]"
          >
            <path d="M5 8V5h3" />
            <path d="M19 8V5h-3" />
            <path d="M5 16v3h3" />
            <path d="M19 16v3h-3" />
            <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="9" r="1.5" fill="currentColor" />
            <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
            <path d="M12 11c-2 0-3 1.5-3 2.5s1 2.5 3 2.5 3-1.5 3-2.5-1-2.5-3-2.5z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </>
  );
};

const InteractiveDots = ({ isDarkMode, lowIntensity }: { isDarkMode: boolean; lowIntensity: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let frames: number;
    const particles: { baseX: number; baseY: number; x: number; y: number }[] = [];
    let mouseX = -1000;
    let mouseY = -1000;

    const hardwareThreads = navigator.hardwareConcurrency || 4;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    const lowPower = hardwareThreads <= 4 || deviceMemory <= 4;
    const spacing = lowPower ? 54 : lowIntensity ? 62 : window.innerWidth < 1200 ? 44 : 36;
    const radius = 1.3;
    const mouseRadius = lowIntensity ? 84 : 100;
    const mouseRadiusSq = mouseRadius * mouseRadius;
    const pushForce = lowIntensity ? 36 : 50;

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower || lowIntensity ? 1 : 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;
      const cols = Math.floor(window.innerWidth / spacing) + 2;
      const rows = Math.floor(window.innerHeight / spacing) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          particles.push({ baseX: x, baseY: y, x, y });
        }
      }
    };

    const draw = () => {
      if (document.hidden) {
        frames = requestAnimationFrame(draw);
        return;
      }
      // Clear using CSS pixel space to avoid zoom-level artifacts.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const dotColor = isDarkMode ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.45)';
      ctx.fillStyle = dotColor;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.baseX;
        const dy = mouseY - p.baseY;
        const distanceSq = dx * dx + dy * dy;

        let targetX = p.baseX;
        let targetY = p.baseY;

        if (distanceSq < mouseRadiusSq) {
          const distance = Math.sqrt(distanceSq);
          const angle = Math.atan2(dy, dx);
          const force = Math.pow((mouseRadius - distance) / mouseRadius, 2);
          targetX = p.baseX - Math.cos(angle) * pushForce * force;
          targetY = p.baseY - Math.sin(angle) * pushForce * force;
        }

        p.x += (targetX - p.x) * 0.12;
        p.y += (targetY - p.y) * 0.12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      frames = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    init();
    draw();

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseout', onMouseLeave);
    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseLeave);
      window.removeEventListener('resize', init);
      cancelAnimationFrame(frames);
    };
  }, [isDarkMode, lowIntensity]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none -z-10" />;
};

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedBreedData, setSelectedBreedData] = useState<{ analysis: AnalysisResult; image: string } | null>(null);
  const blobsRef = useRef<HTMLDivElement>(null);
  const [useHeavyChrome, setUseHeavyChrome] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('pashu-theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const useAnimatedShell = useHeavyChrome;
  const lowIntensityDots = useMemo(
    () => currentView === AppView.TECHNICAL_DOCS || currentView === AppView.CHAT || currentView === AppView.BREED_INFO,
    [currentView],
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('pashu-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pashu-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqCoarse = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      const hardwareThreads = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      const lowPower = hardwareThreads <= 4 || deviceMemory <= 4;
      const ok = !mqReduce.matches && !mqCoarse.matches && !lowPower;
      setUseHeavyChrome(ok);
    };
    sync();
    mqReduce.addEventListener('change', sync);
    mqCoarse.addEventListener('change', sync);
    return () => {
      mqReduce.removeEventListener('change', sync);
      mqCoarse.removeEventListener('change', sync);
      document.documentElement.classList.remove('pashu-custom-cursor');
    };
  }, []);

  useEffect(() => {
    // Hide the native cursor only when the custom cursor is actually rendered.
    document.documentElement.classList.toggle('pashu-custom-cursor', useAnimatedShell);
    return () => {
      document.documentElement.classList.remove('pashu-custom-cursor');
    };
  }, [useAnimatedShell]);

  useEffect(() => {
    const run = () => {
      warmupModels().catch(() => {});
    };
    let id: number;
    // Start prewarm sooner so Fast mode feels instant on first switch.
    id = window.setTimeout(run, 300);
    return () => {
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!useAnimatedShell) return;
    let animId: number;
    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const updateBlobs = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;

      if (blobsRef.current) {
        blobsRef.current.style.transform = `translate(${currentX * -40}px, ${currentY * -40}px)`;
      }
      animId = requestAnimationFrame(updateBlobs);
    };

    window.addEventListener('mousemove', onMouseMove);
    updateBlobs();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [useAnimatedShell]);

  const handleBreedSelect = (analysis: AnalysisResult, image: string) => {
    setSelectedBreedData({ analysis, image });
    setCurrentView(AppView.BREED_INFO);
  };

  const viewNode = useMemo(() => {
    switch (currentView) {
      case AppView.HOME:
        return <Hero onChangeView={setCurrentView} />;
      case AppView.SCANNER:
        return <Scanner onViewDetails={handleBreedSelect} />;
      case AppView.TECHNICAL_DOCS:
        return <TechnicalDocs />;
      case AppView.BREED_INFO:
        return <BreedInfo data={selectedBreedData} onBack={() => setCurrentView(AppView.SCANNER)} />;
      case AppView.CHAT:
        return <ChatBot />;
      case AppView.LIVE_ASSISTANT:
        return <LiveAssistant />;
      case AppView.YOLO_SEGMENT:
        return <YoloSegment />;
      default:
        return <Hero onChangeView={setCurrentView} />;
    }
  }, [currentView, selectedBreedData]);

  return (
    <div className="relative overflow-x-hidden min-h-screen w-full bg-[#F0FDF4] dark:bg-[#022C22] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {useAnimatedShell && <CustomCursor />}

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/50 to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950 opacity-100 mix-blend-normal transition-opacity duration-500" />

        <div ref={blobsRef} className="absolute inset-[-16%] w-[132%] h-[132%] will-change-transform z-10 opacity-70">
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-emerald-300/30 dark:bg-emerald-500/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-sky-300/30 dark:bg-sky-500/20 rounded-full blur-[100px]" />
        </div>

        {useAnimatedShell && (
          <div className="absolute inset-0 z-20 mix-blend-normal">
            <InteractiveDots isDarkMode={isDarkMode} lowIntensity={lowIntensityDots} />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          currentView={currentView}
          onChangeView={setCurrentView}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        <main className="flex-grow pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={useAnimatedShell ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={useAnimatedShell ? { opacity: 0, y: -10 } : undefined}
              transition={useAnimatedShell ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
              className="w-full h-full"
            >
              <Suspense fallback={<ViewFallback />}>{viewNode}</Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
