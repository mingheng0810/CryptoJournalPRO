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
  const [sl, setSl] = useState(editingTrade?.sl?.toString() || '');
  const [marginInput, setMarginInput] = useState(editingTrade?.positionSize?.toString() || '');
  const [status, setStatus] = useState<'Active' | 'Closed'>(editingTrade?.status || 'Active');
  const [review, setReview] = useState(editingTrade?.review || REVIEW_TEMPLATE);
  const [snapshot, setSnapshot] = useState<string | undefined>(editingTrade?.snapshot);
  const [timestamp] = useState(editingTrade?.timestamp || new Date().toISOString());

  // Calculator States
  const [riskPercent, setRiskPercent] = useState<string>('2');
  const [showCalculator, setShowCalculator] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAccount = useMemo(() => accounts.find(a => a.id === accountId) || accounts[0], [accounts, accountId]);

  // Calculation Logic
  const calculations = useMemo(() => {
    const entryPrice = parseFloat(entry);
    const slPrice = parseFloat(sl);
    const risk = parseFloat(riskPercent) / 100;
    const balance = currentAccount?.initialBalance || 0;

    if (!entryPrice || !slPrice || entryPrice <= 0) return { slPct: 0, riskAmt: 0, posValue: 0 };

    const slPct = Math.abs(entryPrice - slPrice) / entryPrice;
    const riskAmt = balance * risk;
    const posValue = slPct > 0 ? riskAmt / slPct : 0;

    return { slPct: slPct * 100, riskAmt, posValue };
  }, [entry, sl, riskPercent, currentAccount]);

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
    const entryPrice = parseFloat(entry);
    const margin = parseFloat(marginInput) || 0;
    
    const trade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: timestamp,
      symbol: symbolSearch,
      direction,
      leverage,
      entry: entryPrice,
      sl: parseFloat(sl),
      tps: editingTrade?.tps || [],
      pnlPercentage: editingTrade?.pnlPercentage || 0,
      pnlAmount: editingTrade?.pnlAmount || 0,
      review,
      snapshot,
      strategy: editingTrade?.strategy || strategies[0]?.name || '',
      accountId,
      positionSize: margin,
      positionUnit: 'Margin',
      status,
    };

    onAddTrade(trade);
  };

  const filteredSymbols = symbols.filter(s => s.name.toLowerCase().includes(symbolSearch.toLowerCase()));

  return (
    <div className="p-6 max-w-2xl mx-auto pb-48 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center px-1">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Execution Protocol</h2>
           <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900/50">
              <button type="button" onClick={() => setStatus('Active')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${status === 'Active' ? 'bg-[#00FFFF] text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'text-zinc-600'}`}>{status === 'Active' && <span className="mr-1.5 w-1.5 h-1.5 bg-black rounded-full inline-block animate-pulse" />}Active</button>
              <button type="button" onClick={() => setStatus('Closed')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${status === 'Closed' ? 'bg-white text-black' : 'text-zinc-600'}`}>Closed</button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative group">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.symbol}</label>
            <input value={symbolSearch} onChange={(e) => {setSymbolSearch(e.target.value); setShowSymbolResults(true);}} onFocus={() => setShowSymbolResults(true)} placeholder={t.searchSymbol} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none transition-all placeholder:text-zinc-800" />
            {showSymbolResults && symbolSearch && (
              <div className="absolute z-50 w-full mt-3 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                {filteredSymbols.map(s => (
                  <div key={s.id} onClick={() => { setSymbolSearch(s.name); setShowSymbolResults(false); }} className="px-6 py-4 hover:bg-zinc-900 cursor-pointer text-xs font-bold border-b border-zinc-900/50 last:border-0">{s.name}</div>
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
            <button type="button" onClick={() => setDirection('Long')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${direction === 'Long' ? 'bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-zinc-700 hover:text-zinc-500'}`}>Long</button>
            <button type="button" onClick={() => setDirection('Short')} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${direction === 'Short' ? 'bg-[#EF4444] text-black shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-zinc-700 hover:text-zinc-500'}`}>Short</button>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.leverage}</label><span className="text-[#00FFFF] font-sans text-sm font-black">{leverage}x</span></div>
             <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full accent-[#00FFFF] h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
           <InputGroup label={t.entry} value={entry} onChange={setEntry} type="number" />
           <InputGroup label={t.sl} value={sl} onChange={setSl} type="number" />
           <InputGroup label={t.margin} value={marginInput} onChange={setMarginInput} type="number" />
        </div>

        {/* Position Calculator Section */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-[#00FFFF] uppercase tracking-[0.3em]">{t.calculator}</h3>
              <button type="button" onClick={() => setShowCalculator(!showCalculator)} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white transition-colors">
                {showCalculator ? 'Hide' : 'Show'}
              </button>
           </div>
           
           {showCalculator && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.riskPercent}</label>
                      <div className="flex items-center gap-3">
                        <input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-20 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-[#00FFFF] outline-none" />
                        <span className="text-xs font-black text-zinc-700">%</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.slPct}</label>
                      <div className="text-xl font-black font-sans text-red-500 tracking-tighter">{calculations.slPct.toFixed(2)}%</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.riskAmt}</label>
                      <div className="text-xl font-black font-sans text-white tracking-tighter">{calculations.riskAmt.toFixed(2)} <span className="text-[10px] text-zinc-600 ml-1">USDT</span></div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.posValue}</label>
                      <div className="text-xl font-black font-sans text-[#00FFFF] tracking-tighter">{calculations.posValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] text-zinc-600 ml-1">USDT</span></div>
                   </div>
                </div>
                
                <p className="text-[8px] text-zinc-700 uppercase font-black tracking-widest leading-relaxed">
                  Recommended margin at current leverage ({leverage}x): <span className="text-white">{(calculations.posValue / leverage).toFixed(2)} USDT</span>
                </p>
             </div>
           )}
        </section>

        <div className="space-y-3">
           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">Trade Snapshot (Chart Analysis)</label>
           <div onClick={() => fileInputRef.current?.click()} className={`min-h-[220px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${snapshot ? 'border-[#00FFFF]/20 bg-[#00FFFF]/5' : 'border-zinc-900 bg-zinc-950/50 hover:border-zinc-800'}`}>
             {snapshot ? (
                <div className="relative w-full h-full group">
                    <img src={snapshot} className="w-full h-full object-contain p-2 max-h-[300px]" alt="Snapshot" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full">Change Image</span>
                    </div>
                </div>
             ) : (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto text-2xl opacity-40">📷</div>
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest block">Click to upload execution snapshot</span>
                </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">{t.review}</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-[2rem] px-6 py-6 text-sm font-sans text-zinc-400 min-h-[140px] focus:border-[#00FFFF]/40 outline-none leading-relaxed resize-none" />
        </div>

        <button type="submit" className="w-full py-6 bg-[#00FFFF] text-black rounded-[2rem] font-[900] text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(0,255,255,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all">
          {editingTrade ? 'Update Execution' : 'Initiate Protocol'}
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-sans focus:border-[#00FFFF]/50 outline-none transition-all" />
  </div>
);

export default LogTrade;
