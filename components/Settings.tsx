
import React, { useState, useRef } from 'react';
import { Account, Category, Language, Trade } from '../types';
import { TRANSLATIONS } from '../constants';

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
  onAddAccount, onUpdateAccount, onImportTrades, onAddSymbol, onDeleteSymbol, onAddStrategy, onDeleteStrategy, onDeleteAccount 
}) => {
  const t = TRANSLATIONS[lang];
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newSymbolName, setNewSymbolName] = useState('');
  const [newStrategyName, setNewStrategyName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateBalance = (acc: Account, newBalance: string) => {
    const balance = parseFloat(newBalance);
    if (!isNaN(balance)) {
      onUpdateAccount({ ...acc, initialBalance: balance });
    }
  };

  // 進階日期解析：解析 "2025年11月12日 星期三 20:00:00"
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
    } catch (e) {
      return new Date().toISOString();
    }
  };

  // 專業級 CSV 狀態機解析器 (處理包含換行與引號的儲存格)
  const parseCSV = (text: string) => {
    const result: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          cell += '"'; i++; // 轉義引號
        } else if (char === '"') {
          inQuotes = false;
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(cell.trim());
          cell = '';
        } else if (char === '\n' || char === '\r') {
          if (cell !== '' || row.length > 0) {
            row.push(cell.trim());
            result.push(row);
            row = [];
            cell = '';
          }
          if (char === '\r' && nextChar === '\n') i++; // 跳過 \r\n
        } else {
          cell += char;
        }
      }
    }
    if (cell !== '' || row.length > 0) {
      row.push(cell.trim());
      result.push(row);
    }
    return result;
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

      // 從第 2 行開始 (跳過標題)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 10) continue;

        const timestampRaw = row[0];
        const statusRaw = row[3]; // DONE?
        const symbol = row[4] || 'UNKNOWN';
        const directionRaw = row[5];
        const leverage = parseFloat(row[6]) || 1;
        const entry = parseFloat(row[7]) || 0;
        const margin = parseFloat(row[11]) || 0;
        const exit = parseFloat(row[15]) || 0;
        const pnlAmt = parseFloat(row[16]) || 0;
        const pnlPct = parseFloat((row[17] || '0').replace('%', '')) || 0;
        const endingBalance = parseFloat(row[19]) || 0; // 結束可用餘額
        const review = row[21] || '';

        // 更新最後看到的餘額 (同步 Sheet 與 App)
        if (!isNaN(endingBalance) && endingBalance > 0) {
          lastAvailableBalance = endingBalance;
        }

        const isClosed = !['持倉', 'PENDING', ''].includes(statusRaw);

        /* Fixed: Added missing 'snapshots' property to satisfy the Trade type definition */
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
      
      // 自動同步餘額邏輯：將當前帳戶餘額更新為 Sheet 中的最後餘額
      if (lastAvailableBalance > 0) {
        onUpdateAccount({ ...accounts[0], currentBalance: lastAvailableBalance });
      }
      
      onImportTrades(newTrades);
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const exportData = () => {
    const data = {
      trades: JSON.parse(localStorage.getItem('crypto_journal_trades_v4') || '[]'),
      accounts,
      symbols,
      strategies,
      lang,
      exportDate: new Date().toISOString()
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
      } catch (err) {
        alert('匯入失敗：檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
      
      {/* Language Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.language}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-3 flex shadow-2xl">
           <button onClick={() => setLang('zh')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'zh' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>繁體中文</button>
           <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'en' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>ENGLISH</button>
        </div>
      </section>

      {/* Backup & Import Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Data Protocol (數據連動)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <button 
             onClick={exportData}
             className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-zinc-900 rounded-2xl hover:border-[#00FFFF]/30 transition-all group"
           >
              <span className="text-xl group-hover:scale-110 transition-transform">💾</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Backup JSON</span>
           </button>
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-zinc-900 rounded-2xl hover:border-emerald-500/30 transition-all group"
           >
              <span className="text-xl group-hover:scale-110 transition-transform">🔄</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Restore All</span>
              <input type="file" ref={fileInputRef} onChange={importData} className="hidden" accept=".json" />
           </button>
           <button 
             onClick={() => csvInputRef.current?.click()}
             className="flex flex-col items-center justify-center gap-2 p-5 bg-[#0A0A0A] border border-[#00FFFF]/20 rounded-2xl hover:bg-[#00FFFF]/5 transition-all group"
           >
              <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#00FFFF]">Import CSV</span>
              <input type="file" ref={csvInputRef} onChange={handleCsvImport} className="hidden" accept=".csv" />
           </button>
        </div>
        <p className="text-[8px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">支援您的 Google Sheets 專業 CSV 格式<br/>(自動同步帳戶餘額與中文日期數據)</p>
      </section>

      {/* Accounts Section */}
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
                {accounts.length > 1 && (
                  <button onClick={() => onDeleteAccount(acc.id)} className="p-2 bg-red-900/10 rounded-xl hover:bg-red-500 transition-all">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.initialBalance}</label>
                <input 
                  type="number" 
                  defaultValue={acc.initialBalance}
                  onBlur={(e) => handleUpdateBalance(acc, e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-[#00FFFF] outline-none focus:border-[#00FFFF] transition-all" 
                />
              </div>
            </div>
          ))}

          <div className="space-y-4 pt-6 border-t border-[#1A1A1A]">
             <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">Add New Account</h3>
             <input placeholder="Name" value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-[#00FFFF] outline-none" />
             <div className="flex gap-2">
                <input type="number" placeholder="Balance" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-[#00FFFF] outline-none" />
                <button onClick={() => { if(newAccName && newAccBalance) { onAddAccount({ name: newAccName, initialBalance: parseFloat(newAccBalance) }); setNewAccName(''); setNewAccBalance(''); } }} className="bg-white text-black px-8 rounded-2xl font-black text-[10px] uppercase">ADD</button>
             </div>
          </div>
        </div>
      </section>

      {/* Symbols Management */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Symbol Protocol (交易對)</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 space-y-4 shadow-2xl">
           <div className="flex gap-2">
              <input 
                placeholder="Ex: ARB/USDT" 
                value={newSymbolName} 
                onChange={e => setNewSymbolName(e.target.value)} 
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-3 text-xs focus:border-[#00FFFF] outline-none" 
              />
              <button 
                onClick={() => { if(newSymbolName) { onAddSymbol(newSymbolName); setNewSymbolName(''); } }}
                className="bg-[#00FFFF] text-black px-6 rounded-xl font-black text-[10px] uppercase"
              >
                ADD
              </button>
           </div>
           <div className="flex flex-wrap gap-2 pt-2">
              {symbols.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] font-black font-mono tracking-tighter">{s.name}</span>
                  <button onClick={() => onDeleteSymbol(s.id)} className="text-zinc-600 hover:text-red-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Strategy Management */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">Strategy Protocol (交易策略)</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 space-y-4 shadow-2xl">
           <div className="flex gap-2">
              <input 
                placeholder="Ex: Liquidity Sweep" 
                value={newStrategyName} 
                onChange={e => setNewStrategyName(e.target.value)} 
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-5 py-3 text-xs focus:border-[#00FFFF] outline-none" 
              />
              <button 
                onClick={() => { if(newStrategyName) { onAddStrategy(newStrategyName); setNewStrategyName(''); } }}
                className="bg-[#00FFFF] text-black px-6 rounded-xl font-black text-[10px] uppercase"
              >
                ADD
              </button>
           </div>
           <div className="flex flex-wrap gap-2 pt-2">
              {strategies.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{s.name}</span>
                  <button onClick={() => onDeleteStrategy(s.id)} className="text-zinc-600 hover:text-red-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
