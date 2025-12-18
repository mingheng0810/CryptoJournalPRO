import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TRANSLATIONS, REVIEW_TEMPLATE } from '../constants';
import { Trade, TradeDirection, Account, Category, Language } from '../types';

interface LogTradeProps {
  onAddTrade: (trade: Trade) => void;
  accounts: Account[];
  symbols: Category[];
  strategies: Category[];
  lang: Language;
  editingTrade?: Trade | null;
}

const LogTrade: React.FC<LogTradeProps> = ({ onAddTrade, accounts, symbols, strategies, lang, editingTrade }) => {
  const t = TRANSLATIONS[lang];
  
  const [accountId, setAccountId] = useState(editingTrade?.accountId || accounts[0]?.id || '');
  const [symbolSearch, setSymbolSearch] = useState(editingTrade?.symbol || '');
  const [showSymbolResults, setShowSymbolResults] = useState(false);
  const [direction, setDirection] = useState<TradeDirection>(editingTrade?.direction || 'Long');
  const [leverage, setLeverage] = useState(editingTrade?.leverage || 20);
  const [entry, setEntry] = useState(editingTrade?.entry?.toString() || '');
  const [exit, setExit] = useState(editingTrade?.exit?.toString() || '');
  const [sl, setSl] = useState(editingTrade?.sl?.toString() || '');
  const [marginInput, setMarginInput] = useState(editingTrade?.positionSize?.toString() || '');
  const [status, setStatus] = useState<'Active' | 'Closed'>(editingTrade?.status || 'Active');
  const [review, setReview] = useState(editingTrade?.review || REVIEW_TEMPLATE);
  const [snapshot, setSnapshot] = useState<string | undefined>(editingTrade?.snapshot);
  const [timestamp] = useState(editingTrade?.timestamp || new Date().toISOString());

  // 如果是從歷史紀錄跳過來的編輯，偵測其狀態
  useEffect(() => {
    if (editingTrade) {
        setAccountId(editingTrade.accountId);
        setSymbolSearch(editingTrade.symbol);
        setDirection(editingTrade.direction);
        setLeverage(editingTrade.leverage);
        setEntry(editingTrade.entry.toString());
        setSl(editingTrade.sl.toString());
        setMarginInput(editingTrade.positionSize.toString());
        setStatus(editingTrade.status);
        setReview(editingTrade.review);
        setSnapshot(editingTrade.snapshot);
        setExit(editingTrade.exit?.toString() || '');
    }
  }, [editingTrade]);

  const [riskPercent, setRiskPercent] = useState<string>('2');
  const [showCalculator, setShowCalculator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAccount = useMemo(() => accounts.find(a => a.id === accountId) || accounts[0], [accounts, accountId]);

  // 盈虧預覽計算
  const pnlPreview = useMemo(() => {
    const entryPrice = parseFloat(entry);
    const exitPrice = parseFloat(exit);
    const posSize = parseFloat(marginInput);
    if (!entryPrice || !exitPrice || !posSize) return null;

    const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    const pnlPct = (diff / entryPrice) * leverage * 100;
    const pnlAmt = posSize * (pnlPct / 100);
    return { pnlPct, pnlAmt };
  }, [entry, exit, direction, leverage, marginInput]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSnapshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let pnlPercentage = 0;
    let pnlAmount = 0;
    const entryPrice = parseFloat(entry) || 0;
    const exitPrice = parseFloat(exit) || 0;
    const posSize = parseFloat(marginInput) || 0;

    if (status === 'Closed' && entryPrice && exitPrice) {
        const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
        pnlPercentage = (diff / entryPrice) * leverage * 100;
        pnlAmount = posSize * (pnlPercentage / 100);
    }

    const trade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: timestamp,
      closeTimestamp: status === 'Closed' ? (editingTrade?.closeTimestamp || new Date().toISOString()) : undefined,
      symbol: symbolSearch,
      direction,
      leverage,
      entry: entryPrice,
      exit: status === 'Closed' ? exitPrice : undefined,
      sl: parseFloat(sl) || 0,
      tps: editingTrade?.tps || [],
      pnlPercentage,
      pnlAmount,
      review,
      snapshot,
      strategy: editingTrade?.strategy || strategies[0]?.name || '',
      accountId,
      positionSize: posSize,
      positionUnit: 'Margin',
      status,
      aiFeedback: editingTrade?.aiFeedback
    };
    onAddTrade(trade);
  };

  const filteredSymbols = symbols.filter(s => s.name.toLowerCase().includes(symbolSearch.toLowerCase()));

  return (
    <div className="p-6 max-w-2xl mx-auto pb-48 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center px-1">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Protocol Initiation</h2>
           <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/50">
              <button type="button" onClick={() => setStatus('Active')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${status === 'Active' ? 'bg-[#00FFFF] text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'text-zinc-600'}`}>Active</button>
              <button type="button" onClick={() => setStatus('Closed')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${status === 'Closed' ? 'bg-white text-black shadow-lg' : 'text-zinc-600'}`}>Closed</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.symbol}</label>
            <input value={symbolSearch} onChange={(e) => {setSymbolSearch(e.target.value); setShowSymbolResults(true);}} placeholder={t.searchSymbol} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none transition-all" />
            {showSymbolResults && symbolSearch && (
              <div className="absolute z-50 w-full mt-3 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                {filteredSymbols.map(s => (
                  <div key={s.id} onClick={() => { setSymbolSearch(s.name); setShowSymbolResults(false); }} className="px-6 py-4 hover:bg-zinc-900 cursor-pointer text-xs font-bold border-b border-zinc-900/50">{s.name}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.account}</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none appearance-none cursor-pointer">
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex bg-zinc-950 p-1.5 rounded-3xl border border-zinc-900">
            <button type="button" onClick={() => setDirection('Long')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${direction === 'Long' ? 'bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-zinc-700'}`}>Long</button>
            <button type="button" onClick={() => setDirection('Short')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${direction === 'Short' ? 'bg-[#EF4444] text-black shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-zinc-700'}`}>Short</button>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.leverage}</label><span className="text-[#00FFFF] font-sans text-sm font-black">{leverage}x</span></div>
             <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full accent-[#00FFFF] h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-5 ${status === 'Closed' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
           <InputGroup label={t.entry} value={entry} onChange={setEntry} type="number" />
           {status === 'Closed' && (
             <InputGroup label={t.exit} value={exit} onChange={setExit} type="number" highlight />
           )}
           <InputGroup label={t.sl} value={sl} onChange={setSl} type="number" />
           <InputGroup label={t.margin} value={marginInput} onChange={setMarginInput} type="number" />
        </div>

        {status === 'Closed' && pnlPreview && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex justify-around animate-in zoom-in-95 duration-300">
             <div className="text-center">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">預計盈虧 %</div>
                <div className={`text-2xl font-black font-mono ${pnlPreview.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pnlPreview.pnlPct > 0 ? '+' : ''}{pnlPreview.pnlPct.toFixed(2)}%
                </div>
             </div>
             <div className="w-[1px] h-10 bg-zinc-900 self-center"></div>
             <div className="text-center">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">預計盈虧金額</div>
                <div className={`text-2xl font-black font-mono ${pnlPreview.pnlAmt >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                   ${pnlPreview.pnlAmt.toFixed(2)}
                </div>
             </div>
          </div>
        )}

        <div className="space-y-3">
           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">Execution Snapshot</label>
           <div onClick={() => fileInputRef.current?.click()} className={`min-h-[200px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${snapshot ? 'border-[#00FFFF]/20 bg-[#00FFFF]/5' : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-800'}`}>
             {snapshot ? (
                <div className="relative w-full h-full group p-2">
                    <img src={snapshot} className="w-full h-full object-contain max-h-[300px] rounded-2xl" alt="Snapshot" />
                </div>
             ) : (
                <div className="text-center space-y-4 opacity-40">
                  <div className="text-2xl">📸</div>
                  <span className="text-[10px] font-black uppercase tracking-widest block">Upload Chart</span>
                </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">{t.review}</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-[2rem] px-6 py-6 text-sm text-zinc-400 min-h-[140px] focus:border-[#00FFFF]/40 outline-none leading-relaxed resize-none" />
        </div>

        <button type="submit" className="w-full py-6 bg-[#00FFFF] text-black rounded-[2rem] font-[900] text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(0,255,255,0.2)] hover:scale-[1.01] transition-all">
          {editingTrade ? 'Update Protocol' : 'Execute Protocol'}
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; highlight?: boolean }> = ({ label, value, onChange, type = "text", highlight }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-zinc-950 border rounded-2xl px-6 py-5 text-sm font-sans outline-none transition-all ${highlight ? 'border-[#00FFFF] text-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-zinc-900 focus:border-zinc-700'}`} />
  </div>
);

export default LogTrade;