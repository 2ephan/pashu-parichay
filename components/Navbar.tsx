import React from 'react';
import { AppView } from '../types';
import { Menu, X, ScanLine, MessageSquare, Radio, Moon, Sun, Cpu } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', value: AppView.HOME },
  { label: 'Precision Scan', value: AppView.SCANNER },
  { label: 'YOLO Segment', value: AppView.YOLO_SEGMENT },
  { label: 'Neural Chat', value: AppView.CHAT },
  { label: 'Live Vision', value: AppView.LIVE_ASSISTANT },
  { label: 'System Docs', value: AppView.TECHNICAL_DOCS },
] as const;

export const Navbar: React.FC<NavbarProps> = React.memo(({ currentView, onChangeView, isDarkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed w-full z-50 top-0 start-0 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => onChangeView(AppView.HOME)}>
            <div className="relative">
                <div className="absolute -inset-1 bg-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-900 dark:bg-black p-2 rounded-lg mr-3 ring-1 ring-slate-900/5 dark:ring-slate-800">
                    <ScanLine className="text-emerald-400 w-6 h-6" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight leading-none">
                    Pashu<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Parichay</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">AI Diagnostic System</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.value}
                onClick={() => onChangeView(item.value)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center group overflow-hidden ${
                  currentView === item.value 
                    ? 'text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {currentView === item.value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"></div>
                )}
                <span className="relative flex items-center z-10">
                    {item.value === AppView.YOLO_SEGMENT && <ScanLine className="w-4 h-4 mr-2" />}
                    {item.value === AppView.CHAT && <MessageSquare className="w-4 h-4 mr-2" />}
                    {item.value === AppView.LIVE_ASSISTANT && <Radio className="w-4 h-4 mr-2" />}
                    {item.value === AppView.TECHNICAL_DOCS && <Cpu className="w-4 h-4 mr-2" />}
                    {item.label}
                </span>
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-4"></div>

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 dark:text-slate-400">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 absolute w-full z-50">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onChangeView(item.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium flex items-center ${
                  currentView === item.value
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 flex justify-between items-center border-t border-slate-200 dark:border-slate-800 mt-4">
                <span className="text-sm text-slate-500 dark:text-slate-400 pl-2">Theme Preference</span>
                <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-900"
                >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
});