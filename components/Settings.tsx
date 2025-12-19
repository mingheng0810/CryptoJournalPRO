
import React, { useState, useRef, useEffect } from 'react';
import { Account, Category, Language, Trade } from '../types';
import { TRANSLATIONS } from '../constants';
import AuthGate from './AuthGate';

interface SettingsProps {
  accounts: Account[];
  symbols: Category[];
  strategies: Category[];
  lang: Language;
  setLang: (l: Language) => void;
  onAddAccount: (acc: Partial<Account>) => void;
  onUpdateAccount: (acc: Account) => void;
  onImportTrades: (trades: Trade[]) => void;
  onAddSymbol: (name: string) => void;
  onDeleteSymbol: (id: string) => void;
  onAddStrategy: (name: string) => void;
  onDeleteStrategy: (id: string) => void;
  onDeleteAccount: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  accounts, symbols, strategies, lang, setLang,
  onUpdateAccount, onImportTrades
}) => {
  const t = TRANSLATIONS[lang];
  const [isPinSet, setIsPinSet] = useState(!!localStorage.getItem('mh_security_pin'));
  const [showPinSetup, setShowPinSetup] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateBalance = (acc: Account, newBalance: string) => {
    const balance = parseFloat(newBalance);
    if (!isNaN(balance)) {
      onUpdateAccount({ ...acc, initialBalance: balance });
    }
  };

  const removePin = () => {
    if (window.confirm('確定要移除安全 PIN 碼嗎？這將降低您的帳戶安全性。')) {
      localStorage.removeItem('mh_security_pin');
      sessionStorage.removeItem('mh_auth_session');
      setIsPinSet(false);
      alert('PIN 碼已成功移除。');
    }
  };

  // CSV 解析與導入邏輯 (保持不變)
  const parseCSV = (text: string) => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (inQuotes) {
        if (char === '"' && nextChar === '"') { cell += '"'; i++; }
        else if (char === '"') inQuotes = false;
        else cell += char;
      } else {
        if (char === '"') inQuotes = true;
        else if (char === ',') { row.push(cell.trim()); cell = ''; }
        else if (char === '\n' || char === '\r') {
          if (cell !== '' || row.length > 0) { row.push(cell.trim()); result.push(row); row = []; cell = ''; }
          if (char === '\r' && nextChar === '\n') i++;
        } else cell += char;
      }
    }
    if (cell !== '' || row.length > 0) { row.push(cell.trim()); result.push(row); }
    return result;
  };

  const parseChineseDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '') return new Date().toISOString();
    try {
      const cleaned = dateStr.trim();
      const match = cleaned.match(/(\d{4})年(\d{1,2})月(\d{1,2})日.*(\d{1,2}:\d{2}:\d{2})/);
      if (match) {
        const [_, y, m, d, time] = match;
        return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time}`).toISOString();
      }
      const parsed = new Date(cleaned);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } catch (e) { return new Date().toISOString(); }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      const rows = parseCSV(csvContent);
      const newTrades: Trade[] = [];
      const accountId = accounts[0]?.id || 'default';
      let lastAvailableBalance = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 10) continue;
        const timestampRaw = row[0];
        const statusRaw = row[3];
        const symbol = row[4] || 'UNKNOWN';
        const directionRaw = row[5];
        const leverage = parseFloat(row[6]) || 1;
        const entry = parseFloat(row[7]) || 0;
        const margin = parseFloat(row[11]) || 0;
        const exit = parseFloat(row[15]) || 0;
        const pnlAmt = parseFloat(row[16]) || 0;
        const pnlPct = parseFloat((row[17] || '0').replace('%', '')) || 0;
        const endingBalance = parseFloat(row[19]) || 0;
        const review = row[21] || '';
        if (!isNaN(endingBalance) && endingBalance > 0) lastAvailableBalance = endingBalance;
        const isClosed = !['持倉', 'PENDING', ''].includes(statusRaw);
        newTrades.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: parseChineseDate(timestampRaw),
          closeTimestamp: isClosed ? parseChineseDate(row[1] || timestampRaw) : undefined,
          symbol: symbol.trim().toUpperCase(),
          direction: (directionRaw?.toLowerCase().includes('short') ? 'Short' : 'Long') as any,
          leverage,
          entry,
          exit: isClosed ? exit : undefined,
          sl: parseFloat(row[8]) || 0,
          tps: [],
          pnlPercentage: pnlPct,
          pnlAmount: pnlAmt,
          review: review.trim(),
          snapshots: [],
          strategy: 'Sheet Sync',
          accountId,
          positionSize: margin,
          positionUnit: 'Margin',
          status: isClosed ? 'Closed' : 'Active'
        });
      }
      if (lastAvailableBalance > 0) onUpdateAccount({ ...accounts[0], currentBalance: lastAvailableBalance });
      onImportTrades(newTrades);
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('crypto_journal_trades_v4') || '[]'),
      accounts, symbols, strategies, lang, exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MH_Trading_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('警告：匯入資料將會覆蓋目前所有的交易紀錄與帳戶設定，確定要繼續嗎？')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.trades) localStorage.setItem('crypto_journal_trades_v4', JSON.stringify(data.trades));
        if (data.accounts) localStorage.setItem('crypto_journal_accounts_v4', JSON.stringify(data.accounts));
        if (data.symbols) localStorage.setItem('crypto_journal_symbols_v4', JSON.stringify(data.symbols));
        if (data.strategies) localStorage.setItem('crypto_journal_strategies_v4', JSON.stringify(data.strategies));
        if (data.lang) localStorage.setItem('crypto_journal_lang', data.lang);
        alert('資料還原成功！網頁即將重新整理以套用設定。');
        window.location.reload();
      } catch (err) { alert('匯入失敗：檔案格式不正確'); }
    };
    reader.readAsText(file);
  };

  if (showPinSetup) {
    return <AuthGate onAuthorized={() => { setShowPinSetup(false); setIsPinSet(true); sessionStorage.setItem('mh_auth_session', 'true'); }} />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.language}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-3 flex shadow-2xl">
           <button onClick={() => setLang('zh')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'zh' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>繁體中文</button>
           <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'en' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>ENGLISH</button>
        </div>
      </section>

      {/* 安全協議設定區塊 */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Security Protocol</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
               <span className="text-sm font-black text-white">PIN 碼保護</span>
               <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                 {isPinSet ? '系統已受生物識別/密碼鎖保護' : '尚未啟用身分驗證'}
               </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${isPinSet ? 'bg-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'bg-zinc-800'}`}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {!isPinSet ? (
               <button 
                 onClick={() => setShowPinSetup(true)}
                 className="col-span-2 py-4 bg-[#00FFFF]/10 border border-[#00FFFF]/20 text-[#00FFFF] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#00FFFF]/20 transition-all"
               >
                 啟用 PIN 碼鎖
               </button>
             ) : (
               <>
                <button 
                  onClick={() => setShowPinSetup(true)}
                  className="py-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  修改 PIN 碼
                </button>
                <button 
                  onClick={removePin}
                  className="py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  停用密碼
                </button>
               </>
             )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Data Protocol</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <button onClick={exportData} className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-zinc-900 rounded-2xl hover:border-[#00FFFF]/30 transition-all group">
              <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Backup JSON</span>
           </button>
           <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-zinc-900 rounded-2xl hover:border-emerald-500/30 transition-all group">
              <span className="text-xl group-hover:scale-110 transition-transform">🔄</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Restore All</span>
              <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
           </button>
           <button onClick={() => csvInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-[#00FFFF]/20 rounded-2xl hover:bg-[#00FFFF]/5 transition-all group">
              <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#00FFFF]">Import CSV</span>
              <input type="file" ref={csvInputRef} onChange={handleCsvImport} className="hidden" accept=".csv" />
           </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.account}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 space-y-6 shadow-2xl">
          {accounts.map(acc => (
            <div key={acc.id} className="p-6 bg-[#111] rounded-3xl border border-[#222] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter">{acc.name}</span>
                  <span className="text-[10px] text-[#00FFFF] font-black uppercase tracking-widest">Balance: ${acc.currentBalance.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.initialBalance}</label>
                <input type="number" defaultValue={acc.initialBalance} onBlur={(e) => handleUpdateBalance(acc, e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-[#00FFFF] outline-none focus:border-[#00FFFF] transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="pt-10 border-t border-zinc-900/50 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Protocol Version v2.3 Online</span>
          </div>
          <p className="text-[8px] text-zinc-700 uppercase tracking-[0.2em] font-black">
             Scrubbing Chart & Multi-Photo Protocols Initialized
          </p>
      </footer>
    </div>
  );
};

export default Settings;
