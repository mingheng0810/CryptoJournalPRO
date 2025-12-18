import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lang }) => {
  const t = TRANSLATIONS[lang];
  const MH_LOGO_PATH = "/logo.JPG";

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-[#00FFFF] selection:text-black">
      <header className="px-6 py-8 flex items-center gap-5 max-w-4xl mx-auto w-full">
        <div className="w-14 h-14 border border-zinc-800 flex items-center justify-center bg-zinc-950 rounded-lg overflow-hidden shrink-0">
          <img 
            src={MH_LOGO_PATH} 
            alt="MH" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="text-lg font-black tracking-tighter">MH</div>';
              }
            }}
          />
        </div>

        <div className="w-[1px] h-10 bg-zinc-800 shrink-0"></div>

        <div className="space-y-0.5 overflow-hidden">
          <h1 className="text-lg font-black tracking-tight uppercase flex items-center gap-1.5 whitespace-nowrap">
            MH <span className="text-[#00FFFF]">TRADING</span> JOURNAL PRO
          </h1>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.5em] truncate">
            DISCIPLINE IS FREEDOM
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-zinc-900/50 px-8 pt-4 pb-10 z-50">
        <div className="max-w-md mx-auto flex justify-between">
          <NavButton active={activeTab === 'log'} onClick={() => setActiveTab('log')} label={t.log} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>} />
          <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label={t.history} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} />
          <NavButton active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} label={t.metrics} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 17l6-6 4 4 6-6" /></svg>} />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label={t.settings} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>} />
        </div>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#00FFFF]' : 'text-zinc-700 hover:text-zinc-500'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#00FFFF]/10 ring-1 ring-[#00FFFF]/40 shadow-[0_0_20px_rgba(0,255,255,0.15)]' : ''}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest scale-90">{label}</span>
  </button>
);

export default Layout;
