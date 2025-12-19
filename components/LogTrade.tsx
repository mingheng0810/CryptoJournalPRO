
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
  const [tp, setTp] = useState(editingTrade?.tp?.toString() || '');
  const [sl, setSl] = useState(editingTrade?.sl?.toString() || '');
  const [posInput, setPosInput] = useState(editingTrade?.positionSize?.toString() || '');
  const [posUnit, setPosUnit] = useState<'Margin' | 'Tokens'>(editingTrade?.positionUnit || 'Margin');
  const [status, setStatus] = useState<'Active' | 'Closed'>(editingTrade?.status || 'Active');
  const [review, setReview] = useState(editingTrade?.review || REVIEW_TEMPLATE);
  const [snapshot, setSnapshot] = useState<string | undefined>(editingTrade?.snapshot);
  const [strategy, setStrategy] = useState(editingTrade?.strategy || strategies[0]?.name || '');
  const [timestamp] = useState(editingTrade?.timestamp || new Date().toISOString());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTrade) {
        setAccountId(editingTrade.accountId);
        setSymbolSearch(editingTrade.symbol);
        setDirection(editingTrade.direction);
        setLeverage(editingTrade.leverage);
        setEntry(editingTrade.entry.toString());
        setTp(editingTrade.tp?.toString() || '');
        setSl(editingTrade.sl.toString());
        setPosInput(editingTrade.positionSize.toString());
        setPosUnit(editingTrade.positionUnit);
        setStatus(editingTrade.status);
        setReview(editingTrade.review);
        setSnapshot(editingTrade.snapshot);
        setStrategy(editingTrade.strategy);
        setExit(editingTrade.exit?.toString() || '');
    }
  }, [editingTrade]);

  const pnlPreview = useMemo(() => {
    const entryPrice = parseFloat(entry);
    const exitPrice = parseFloat(exit);
    const amount = parseFloat(posInput);
    if (!entryPrice || isNaN(exitPrice) || !amount) return null;

    const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
    let pnlPct = 0;
    let pnlAmt = 0;

    if (posUnit === 'Margin') {
      pnlPct = (diff / entryPrice) * leverage * 100;
      pnlAmt = amount * (pnlPct / 100);
    } else {
      pnlAmt = diff * amount;
      const estimatedMargin = (amount * entryPrice) / leverage;
      pnlPct = (pnlAmt / estimatedMargin) * 100;
    }
    return { pnlPct, pnlAmt };
  }, [entry, exit, direction, leverage, posInput, posUnit]);

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
    if (!symbolSearch || !entry || !posInput) {
      alert("請填寫必要交易資訊 (交易對、價格、倉位)");
      return;
    }
    
    let pnlPercentage = 0;
    let pnlAmount = 0;
    const entryPrice = parseFloat(entry) || 0;
    const exitPrice = parseFloat(exit) || 0;
    const amount = parseFloat(posInput) || 0;

    if (status === 'Closed' && entryPrice && !isNaN(exitPrice)) {
        const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
        if (posUnit === 'Margin') {
          pnlPercentage = (diff / entryPrice) * leverage * 100;
          pnlAmount = amount * (pnlPercentage / 100);
        } else {
          pnlAmount = diff * amount;
          const estimatedMargin = (amount * entryPrice) / leverage;
          pnlPercentage = (pnlAmount / estimatedMargin) * 100;
        }
    }

    const trade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: timestamp,
      closeTimestamp: status === 'Closed' ? (editingTrade?.closeTimestamp || new Date().toISOString()) : undefined,
      symbol: symbolSearch.toUpperCase(),
      direction,
      leverage,
      entry: entryPrice,
      exit: status === 'Closed' ? exitPrice : undefined,
      tp: parseFloat(tp) || undefined,
      sl: parseFloat(sl) || 0,
      tps: editingTrade?.tps || [],
      pnlPercentage,
      pnlAmount,
      review,
      snapshot,
      strategy,
      accountId,
      positionSize: amount,
      positionUnit: posUnit,
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
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.strategy}</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none appearance-none cursor-pointer">
              {strategies.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
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

        <div className="space-y-5">
           <div className="grid grid-cols-2 gap-4">
              <InputGroup label={t.entry} value={entry} onChange={setEntry} type="number" />
              <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{posUnit === 'Margin' ? t.margin : t.tokens}</label>
                   <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      <button type="button" onClick={() => setPosUnit('Margin')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${posUnit === 'Margin' ? 'bg-[#00FFFF] text-black' : 'text-zinc-500'}`}>$</button>
                      <button type="button" onClick={() => setPosUnit('Tokens')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${posUnit === 'Tokens' ? 'bg-[#00FFFF] text-black' : 'text-zinc-500'}`}>🪙</button>
                   </div>
                 </div>
                 <input type="number" step="any" value={posInput} onChange={e => setPosInput(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl px-6 py-5 text-sm font-sans outline-none focus:border-zinc-700 transition-all" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <InputGroup label={t.tp} value={tp} onChange={setTp} type="number" />
              <InputGroup label={t.sl} value={sl} onChange={setSl} type="number" />
           </div>

           {status === 'Closed' && (
             <InputGroup label={t.exit} value={exit} onChange={setExit} type="number" highlight />
           )}
        </div>

        {status === 'Closed' && pnlPreview && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 flex justify-around animate-in zoom-in-95 duration-300">
             <div className="text-center">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">實收盈虧 %</div>
                <div className={`text-2xl font-black font-mono ${pnlPreview.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pnlPreview.pnlPct > 0 ? '+' : ''}{pnlPreview.pnlPct.toFixed(2)}%
                </div>
             </div>
             <div className="w-[1px] h-10 bg-zinc-900 self-center"></div>
             <div className="text-center">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">盈虧金額</div>
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
                <div className="relative w-full h-full p-2 group">
                    <img src={snapshot} className="w-full h-full object-contain max-h-[350px] rounded-2xl shadow-2xl" alt="Snapshot" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                      <span className="text-[10px] font-black uppercase tracking-widest">Change Image</span>
                    </div>
                </div>
             ) : (
                <div className="text-center space-y-4 opacity-40">
                  <div className="text-3xl">📸</div>
                  <span className="text-[10px] font-black uppercase tracking-widest block">Upload Chart Snapshot</span>
                </div>
             )}
             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
           </div>
        </div>

        <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">{t.review}</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900 rounded-[2rem] px-6 py-6 text-sm text-zinc-400 min-h-[140px] focus:border-[#00FFFF]/40 outline-none leading-relaxed resize-none font-mono" />
        </div>

        <button type="submit" className="w-full py-6 bg-[#00FFFF] text-black rounded-[2rem] font-[900] text-[12px] uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(0,255,255,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all">
          {editingTrade ? t.update : t.submit}
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; highlight?: boolean }> = ({ label, value, onChange, type = "text", highlight }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} step="any" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-zinc-950 border rounded-2xl px-6 py-5 text-sm font-sans outline-none transition-all ${highlight ? 'border-[#00FFFF] text-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'border-zinc-900 focus:border-zinc-700'}`} />
  </div>
);

export default LogTrade;
