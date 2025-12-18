
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

  /**
   * 💡 根據您的 GitHub 截圖：
   * 您的檔案直接上傳在最外層，且副檔名是大寫的 .JPG
   */
  const MH_LOGO_PATH = "./logo.JPG";

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans selection:bg-white selection:text-black transition-all duration-300">
      <header className="border-b border-zinc-900/50 px-6 py-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          {/* Logo 容器 */}
          <div className="w-16 h-16 border border-white/20 flex items-center justify-center overflow-hidden bg-zinc-950">
            <img 
              src={MH_LOGO_PATH} 
              alt="MH Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // 如果圖片抓不到，會顯示文字 Logo 作為備援
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white font-black text-xl tracking-tighter">MH</span>';
                }
              }}
            />
          </div>

          {/* 垂直分割線 */}
          <div className="w-[1px] h-12 bg-zinc-800 mx-2"></div>
          
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-black tracking-tight uppercase leading-none">
              MH <span className="text-[#00FFFF]">TRADING</span> JOURNAL PRO
            </h1>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2 opacity-80">
              Discipline Is Freedom
            </span>
          </div>
        </div>

        {/* 系統狀態指示 */}
        <div className="hidden md:flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-[#00FFFF] animate-pulse shadow-[0_0_8px_#00FFFF]"></div>
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Protocol Active</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="animate-in fade-in duration-500">
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

