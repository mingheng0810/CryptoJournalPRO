
import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS, REVIEW_TEMPLATE, THEME_COLORS } from '../constants';
import { Trade, TradeDirection, Account, Category, TakeProfit, Language } from '../types';

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
  
  // States
  const [accountId, setAccountId] = useState(editingTrade?.accountId || accounts[0]?.id || '');
  const [symbol, setSymbol] = useState(editingTrade?.symbol || '');
  const [symbolSearch, setSymbolSearch] = useState(editingTrade?.symbol || '');
  const [showSymbolResults, setShowSymbolResults] = useState(false);
  
  const [direction, setDirection] = useState<TradeDirection>(editingTrade?.direction || 'Long');
  const [leverage, setLeverage] = useState(editingTrade?.leverage || 20);
  const [entry, setEntry] = useState(editingTrade?.entry?.toString() || '');
  const [exit, setExit] = useState(editingTrade?.exit?.toString() || '');
  const [sl, setSl] = useState(editingTrade?.sl?.toString() || '');
  const [tps, setTps] = useState<TakeProfit[]>(editingTrade?.tps || []);
  const [newTpPrice, setNewTpPrice] = useState('');
  
  const [timestamp, setTimestamp] = useState(editingTrade?.timestamp ? new Date(editingTrade.timestamp).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [closeTimestamp, setCloseTimestamp] = useState(editingTrade?.closeTimestamp ? new Date(editingTrade.closeTimestamp).toISOString().slice(0, 16) : '');
  
  const [strategy, setStrategy] = useState(editingTrade?.strategy || strategies[0]?.name || '');
  const [review, setReview] = useState(editingTrade?.review || REVIEW_TEMPLATE);
  const [snapshot, setSnapshot] = useState<string | undefined>(editingTrade?.snapshot);
  const [marginInput, setMarginInput] = useState(editingTrade?.positionSize?.toString() || '');
  const [status, setStatus] = useState<'Active' | 'Closed'>(editingTrade?.status || 'Active');

  // Preview States
  const [pnlPreview, setPnlPreview] = useState(0);
  const [slPercent, setSlPercent] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync PNL Previews
  useEffect(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    if (!isNaN(e) && !isNaN(s) && e !== 0) {
      const diff = Math.abs(e - s);
      const pct = (diff / e) * 100;
      setSlPercent(pct);
    }
  }, [entry, sl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSnapshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTp = () => {
    const price = parseFloat(newTpPrice);
    if (!isNaN(price)) {
      setTps([...tps, { id: Date.now().toString(), price, status: 'pending' }]);
      setNewTpPrice('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(entry);
    const exitPrice = parseFloat(exit) || 0;
    const margin = parseFloat(marginInput) || 0;
    
    let pnlPct = 0;
    let pnlAmt = 0;

    if (status === 'Closed' && entryPrice > 0 && exitPrice > 0) {
      const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
      pnlPct = (diff / entryPrice) * leverage * 100;
      pnlAmt = margin * (pnlPct / 100);
    }

    const trade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date(timestamp).toISOString(),
      closeTimestamp: closeTimestamp ? new Date(closeTimestamp).toISOString() : undefined,
      symbol,
      direction,
      leverage,
      entry: entryPrice,
      exit: exitPrice > 0 ? exitPrice : undefined,
      sl: parseFloat(sl),
      tps,
      pnlPercentage: pnlPct,
      pnlAmount: pnlAmt,
      review,
      snapshot,
      strategy,
      accountId,
      positionSize: margin,
      positionUnit: 'Margin',
      status,
      aiFeedback: editingTrade?.aiFeedback
    };

    onAddTrade(trade);
  };

  const filteredSymbols = symbols.filter(s => s.name.toLowerCase().includes(symbolSearch.toLowerCase()));

  return (
    <div className="p-6 max-w-2xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
             {editingTrade ? 'Update Execution' : 'New Execution Protocol'}
           </h2>
           <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
              <button 
                type="button"
                onClick={() => setStatus('Active')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'Active' ? 'bg-[#00FFFF] text-black shadow-[0_0_10px_#00FFFF44]' : 'text-zinc-500'}`}
              >
                Active
              </button>
              <button 
                type="button"
                onClick={() => setStatus('Closed')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${status === 'Closed' ? 'bg-white text-black' : 'text-zinc-500'}`}
              >
                Closed
              </button>
           </div>
        </div>

        {/* Symbol & Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{t.symbol}</label>
            <input 
              value={symbolSearch}
              onChange={(e) => { setSymbolSearch(e.target.value); setShowSymbolResults(true); }}
              onFocus={() => setShowSymbolResults(true)}
              placeholder={t.searchSymbol}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-black focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF]/20 outline-none transition-all"
            />
            {showSymbolResults && symbolSearch && (
              <div className="absolute z-50 w-full mt-2 bg-[#0A0A0A] border border-zinc-800 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredSymbols.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setSymbol(s.name); setSymbolSearch(s.name); setShowSymbolResults(false); }}
                    className="px-5 py-3 hover:bg-zinc-900 cursor-pointer text-xs font-bold border-b border-zinc-900 last:border-0"
                  >
                    {s.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{t.account}</label>
            <select 
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-black focus:border-[#00FFFF] outline-none appearance-none"
            >
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        </div>

        {/* Direction & Leverage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="flex bg-[#0A0A0A] p-1.5 rounded-[1.5rem] border border-zinc-800">
            <button 
              type="button" 
              onClick={() => setDirection('Long')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${direction === 'Long' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-zinc-600'}`}
            >
              Long
            </button>
            <button 
              type="button" 
              onClick={() => setDirection('Short')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${direction === 'Short' ? 'bg-red-500 text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'text-zinc-600'}`}
            >
              Short
            </button>
          </div>
          
          <div className="space-y-3">
             <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t.leverage}</label>
                <span className="text-[#00FFFF] font-mono text-xs font-black">{leverage}x</span>
             </div>
             <input 
               type="range" min="1" max="125" step="1" 
               value={leverage} onChange={e => setLeverage(parseInt(e.target.value))}
               className="w-full accent-[#00FFFF] h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
             />
          </div>
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <InputGroup label={t.entry} value={entry} onChange={setEntry} type="number" />
           <InputGroup label={t.sl} value={sl} onChange={setSl} type="number" />
           {status === 'Closed' && <InputGroup label={t.exit} value={exit} onChange={setExit} type="number" />}
           <div>
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{t.margin}</label>
              <input 
                type="number" value={marginInput} onChange={e => setMarginInput(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-mono text-[#00FFFF] focus:border-[#00FFFF] outline-none"
              />
           </div>
        </div>

        {/* Snapshot Upload */}
        <div className="space-y-3">
           <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">Trade Snapshot</label>
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${snapshot ? 'border-[#00FFFF]/30 bg-[#00FFFF]/5' : 'border-zinc-800 bg-[#0A0A0A] hover:border-zinc-700'}`}
           >
             {snapshot ? (
               <img src={snapshot} className="w-full h-full object-cover opacity-80" alt="Preview" />
             ) : (
               <div className="text-center space-y-2">
                 <svg className="w-8 h-8 text-zinc-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Click to upload analysis</span>
               </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        {/* Review & Strategy */}
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{t.strategy}</label>
            <div className="flex flex-wrap gap-2">
               {strategies.map(s => (
                 <button 
                  key={s.id} type="button" 
                  onClick={() => setStrategy(s.name)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${strategy === s.name ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                 >
                   {s.name}
                 </button>
               ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{t.review}</label>
            <textarea 
              value={review} onChange={e => setReview(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-3xl px-5 py-5 text-xs font-mono text-zinc-400 min-h-[150px] focus:border-[#00FFFF] outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Submit Action */}
        <button 
          type="submit"
          className="w-full py-5 bg-[#00FFFF] text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_10px_30px_rgba(0,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          {editingTrade ? 'Update Log' : 'Initiate Log'}
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div>
    <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-1.5 block">{label}</label>
    <input 
      type={type} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-mono focus:border-[#00FFFF] outline-none transition-all"
    />
  </div>
);

export default LogTrade;
