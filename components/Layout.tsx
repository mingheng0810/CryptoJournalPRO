
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
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-[#00FFFF] selection:text-black transition-all duration-300">
      <header className="border-b border-[#1A1A1A] px-6 py-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.4)] flex items-center justify-center">
            <span className="text-black font-black text-xs">CJ</span>
          </div>
          <h1 className="text-sm font-black tracking-widest uppercase">
            TRADING JOURNAL <span className="text-[#00FFFF]">PRO</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-[#1A1A1A] px-6 pt-4 pb-10 z-50">
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
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[#00FFFF]/10 ring-1 ring-[#00FFFF]/30 scale-110' : 'hover:bg-zinc-900'}`}>
      {icon}
    </div>
    <span className="text-[9px] uppercase font-black tracking-[0.2em]">{label}</span>
  </button>
);

export default Layout;
