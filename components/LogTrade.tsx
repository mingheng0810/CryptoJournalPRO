
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
  const [posInput, setPosInput] = useState(editingTrade?.positionSize?.toString() || '0');
  const [posUnit, setPosUnit] = useState<'Margin' | 'Tokens'>(editingTrade?.positionUnit || 'Margin');
  const [status, setStatus] = useState<'Active' | 'Closed'>(editingTrade?.status || 'Active');
  const [review, setReview] = useState(editingTrade?.review || REVIEW_TEMPLATE);
  const [snapshots, setSnapshots] = useState<string[]>(editingTrade?.snapshots || (editingTrade?.snapshot ? [editingTrade.snapshot] : []));
  const [strategy, setStrategy] = useState(editingTrade?.strategy || strategies[0]?.name || '');
  
  const toLocalISO = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [timestamp, setTimestamp] = useState(editingTrade?.timestamp ? toLocalISO(editingTrade.timestamp) : toLocalISO(new Date().toISOString()));

  const [calcVisible, setCalcVisible] = useState(false);
  const [riskPercent, setRiskPercent] = useState('2');

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
        setSnapshots(editingTrade.snapshots || (editingTrade.snapshot ? [editingTrade.snapshot] : []));
        setStrategy(editingTrade.strategy);
        setExit(editingTrade.exit?.toString() || '');
        setTimestamp(toLocalISO(editingTrade.timestamp));
    }
  }, [editingTrade]);

  const calcData = useMemo(() => {
    const activeAccount = accounts.find(a => a.id === accountId) || accounts[0];
    const balance = activeAccount?.currentBalance || 0;
    const entryPrice = parseFloat(entry);
    const stopLoss = parseFloat(sl);
    const riskPct = parseFloat(riskPercent);

    if (!entryPrice || !stopLoss || isNaN(riskPct)) return null;

    const riskAmt = balance * (riskPct / 100);
    const slPct = Math.abs((entryPrice - stopLoss) / entryPrice);
    const posValue = slPct > 0 ? riskAmt / slPct : 0;
    const recommendedMargin = posValue / leverage;

    return { riskAmt, slPct: slPct * 100, posValue, recommendedMargin };
  }, [accounts, accountId, entry, sl, riskPercent, leverage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSnapshots(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSnapshot = (index: number) => {
    setSnapshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolSearch || !entry || !posInput) {
      alert("請填寫必要交易資訊");
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

    onAddTrade({
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date(timestamp).toISOString(),
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
      snapshots,
      strategy,
      accountId,
      positionSize: amount,
      positionUnit: posUnit,
      status
    });
  };

  const filteredSymbols = symbols.filter(s => s.name.toLowerCase().includes(symbolSearch.toLowerCase()));

  return (
    <div className="p-6 max-w-2xl mx-auto pb-48 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="flex justify-between items-center px-1">
           <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Protocol Initiation</h2>
           <div className="flex bg-[#0A0A0A] p-1 rounded-2xl border border-zinc-900 shadow-2xl">
              <button type="button" onClick={() => setStatus('Active')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${status === 'Active' ? 'bg-[#00FFFF] text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'text-zinc-600 hover:text-zinc-400'}`}>Active</button>
              <button type="button" onClick={() => setStatus('Closed')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${status === 'Closed' ? 'bg-white text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>Closed</button>
           </div>
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{t.entryTime}</label>
           <input 
             type="datetime-local" 
             value={timestamp} 
             onChange={e => setTimestamp(e.target.value)}
             className="w-full bg-[#0A0A0A] border border-zinc-900 rounded-[1.25rem] px-6 py-5 text-sm font-black text-[#00FFFF] focus:border-[#00FFFF]/50 outline-none transition-all"
             style={{ colorScheme: 'dark' }}
           />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="relative">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.symbol}</label>
            <input value={symbolSearch} onChange={(e) => {setSymbolSearch(e.target.value); setShowSymbolResults(true);}} placeholder={t.searchSymbol} className="w-full bg-[#0A0A0A] border border-zinc-900 rounded-[1.25rem] px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none transition-all placeholder:text-zinc-800" />
            {showSymbolResults && symbolSearch && (
              <div className="absolute z-50 w-full mt-3 bg-[#0A0A0A] border border-zinc-800 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                {filteredSymbols.map(s => <div key={s.id} onClick={() => { setSymbolSearch(s.name); setShowSymbolResults(false); }} className="px-6 py-4 hover:bg-[#111] cursor-pointer text-xs font-bold border-b border-zinc-900/50">{s.name}</div>)}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{t.strategy}</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-900 rounded-[1.25rem] px-6 py-5 text-sm font-black focus:border-[#00FFFF]/50 outline-none transition-all appearance-none">{strategies.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 items-center">
          <div className="flex bg-[#0A0A0A] p-1.5 rounded-[1.5rem] border border-zinc-900 shadow-xl">
            <button type="button" onClick={() => setDirection('Long')} className={`flex-1 py-5 rounded-[1.25rem] text-[11px] font-black uppercase transition-all duration-300 ${direction === 'Long' ? 'bg-[#10B981] text-black shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'text-zinc-700'}`}>Long</button>
            <button type="button" onClick={() => setDirection('Short')} className={`flex-1 py-5 rounded-[1.25rem] text-[11px] font-black uppercase transition-all duration-300 ${direction === 'Short' ? 'bg-[#EF4444] text-black shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'text-zinc-700'}`}>Short</button>
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.leverage}</label><span className="text-[#00FFFF] font-black text-sm">{leverage}x</span></div>
             <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full accent-[#00FFFF] h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
           <InputGroup label={t.entry} value={entry} onChange={setEntry} type="number" />
           <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                   {posUnit === 'Margin' ? t.margin : '本金 (顆數)'}
                </label>
                <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 scale-90">
                   <button type="button" onClick={() => setPosUnit('Margin')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${posUnit === 'Margin' ? 'bg-[#00FFFF] text-black' : 'text-zinc-500'}`}>$</button>
                   <button type="button" onClick={() => setPosUnit('Tokens')} className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${posUnit === 'Tokens' ? 'bg-[#00FFFF] text-black' : 'text-zinc-500'}`}>🪙</button>
                </div>
              </div>
              <input type="number" step="any" value={posInput} onChange={e => setPosInput(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-900 rounded-[1.25rem] px-6 py-5 text-sm outline-none focus:border-zinc-700 transition-all font-sans" />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
           <InputGroup label={t.tp} value={tp} onChange={setTp} type="number" />
           <InputGroup label={t.sl} value={sl} onChange={setSl} type="number" />
        </div>

        <div className="bg-[#0A0A0A] border border-zinc-900 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
           <div className="flex justify-between items-center">
              <h3 className="flex items-center gap-2 text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">⚡️ {t.calculator}</h3>
              <button type="button" onClick={() => setCalcVisible(!calcVisible)} className="text-[8px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">{calcVisible ? 'Hide' : 'Show'}</button>
           </div>
           {calcVisible && (
             <div className="space-y-8 animate-in slide-in-from-top-1">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">{t.riskPercent}</label>
                      <div className="flex items-center gap-3">
                         <input type="number" value={riskPercent} onChange={e => setRiskPercent(e.target.value)} className="w-20 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none focus:border-[#00FFFF]/50" />
                         <span className="text-[10px] font-black text-zinc-700">%</span>
                      </div>
                   </div>
                   <div className="space-y-3 text-right">
                      <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">{t.slPct}</label>
                      <div className={`text-2xl font-black font-mono tracking-tighter ${calcData ? 'text-red-500' : 'text-zinc-800'}`}>{calcData ? `${calcData.slPct.toFixed(2)}%` : '0.00%'}</div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8 border-t border-zinc-900/50 pt-8">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">{t.riskAmt}</label>
                      <div className="text-xl font-black font-mono tracking-tighter text-white">{calcData ? calcData.riskAmt.toFixed(2) : '0.00'} <span className="text-[9px] text-zinc-600 ml-1">USDT</span></div>
                   </div>
                   <div className="space-y-2 text-right">
                      <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-1">{t.posValue}</label>
                      <div className="text-xl font-black font-mono tracking-tighter text-[#00FFFF]">{calcData ? Math.round(calcData.posValue).toLocaleString() : '0'} <span className="text-[9px] text-zinc-600 ml-1">USDT</span></div>
                   </div>
                </div>
             </div>
           )}
        </div>

        <div className="space-y-4">
           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 block">Execution Snapshots ({snapshots.length})</label>
           
           {snapshots.length > 0 && (
             <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
               {snapshots.map((src, i) => (
                 <div key={i} className="relative aspect-video bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden group">
                   <img src={src} className="w-full h-full object-cover" alt={`Snapshot ${i+1}`} />
                   <button 
                    type="button"
                    onClick={() => removeSnapshot(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                   >×</button>
                 </div>
               ))}
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-video border border-dashed border-zinc-800 bg-[#0A0A0A] rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all"
               >
                 <span className="text-xl">+</span>
               </button>
             </div>
           )}

           <div 
             onClick={() => fileInputRef.current?.click()} 
             className={`min-h-[160px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${snapshots.length > 0 ? 'hidden' : 'border-zinc-900 bg-[#0A0A0A] hover:border-zinc-800'}`}
           >
             <div className="text-center space-y-4 opacity-30">
               <div className="text-3xl">📸</div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] block">Upload Multi Snapshots</span>
             </div>
           </div>
           <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" multiple />
        </div>

        <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 block">心得/筆記</label>
            <textarea value={review} onChange={e => setReview(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-900 rounded-[2rem] px-8 py-8 text-sm text-zinc-500 min-h-[160px] focus:border-[#00FFFF]/20 outline-none leading-relaxed resize-none font-mono" />
        </div>

        <button type="submit" className="w-full py-8 bg-[#00FFFF] text-black rounded-[2rem] font-black text-[13px] uppercase tracking-[0.5em] shadow-[0_20px_60px_rgba(0,255,255,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-500">
          {editingTrade ? t.update : t.submit}
        </button>
      </form>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-2.5">
    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
    <input type={type} step="any" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-[#0A0A0A] border border-zinc-900 rounded-[1.25rem] px-6 py-5 text-sm font-sans outline-none focus:border-zinc-700 transition-all`} />
  </div>
);

export default LogTrade;
