
import React from 'react';
import { THEME_COLORS, TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lang }) => {
  const t = TRANSLATIONS[lang];
  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-white selection:text-black transition-all duration-300">
      <header className="border-b border-zinc-900/50 px-6 py-5 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          {/* 精確復刻版 MH Logo SVG - 白色襯線體風格 */}
          <div className="w-12 h-12 flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-full h-full text-white fill-current shadow-2xl">
              {/* M - Serif Style */}
              <path d="M15 85 L15 35 L20 35 L15 35 L15 85 M15 85 L10 85 L20 85 M15 35 L10 35 L20 35" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M15 35 L35 75 L55 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinejoin="miter" />
              <path d="M15 35 V85 M55 35 V85" stroke="currentColor" strokeWidth="6" fill="none" />
              {/* M Foot Serifs */}
              <path d="M10 85 H20 M50 85 H60 M10 35 H20 M50 35 H60" stroke="currentColor" strokeWidth="2" />
              
              {/* H - Serif Style */}
              <path d="M75 35 V85 M105 35 V85 M75 60 H105" stroke="currentColor" strokeWidth="6" fill="none" />
              {/* H Foot Serifs */}
              <path d="M70 35 H80 M100 35 H110 M70 85 H80 M100 85 H110" stroke="currentColor" strokeWidth="2" />
              
              {/* Elegant Swoosh - 更加動態的曲線 */}
              <path d="M45 95 C60 75 65 55 95 20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-[0.2em] uppercase leading-none">
              TRADING JOURNAL <span className="text-[#00FFFF]">PRO</span>
            </h1>
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-1.5 opacity-80">Refined by MH Design</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t border-zinc-900/50 px-6 pt-4 pb-10 z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} label={t.log} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label={t.history} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} />
          <NavButton active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} label={t.metrics} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 17l6-6 4 4 6-6" /></svg>} />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label={lang === 'zh' ? '設定' : 'Settings'} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-[#00FFFF]' : 'text-zinc-600'}`}>
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-[#00FFFF]/10 ring-1 ring-[#00FFFF]/40 scale-110 shadow-[0_0_25px_rgba(0,255,255,0.15)]' : 'hover:bg-zinc-900'}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase font-black tracking-[0.2em]">{label}</span>
  </button>
);

export default Layout;

