
import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS, REVIEW_TEMPLATE } from '../constants';
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
  const activeAccount = accounts.find(a => a.id === (editingTrade?.accountId || accounts[0]?.id)) || accounts[0];
  
  const [accountId, setAccountId] = useState(editingTrade?.accountId || accounts[0]?.id || '');
  const [symbol, setSymbol] = useState(editingTrade?.symbol || symbols[0]?.name || '');
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

  const [pnlPreview, setPnlPreview] = useState(0);
  const [pnlAmountPreview, setPnlAmountPreview] = useState(0);

  const prevExitRef = useRef(exit);
  const symbolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exit && !prevExitRef.current && !closeTimestamp) {
      setCloseTimestamp(new Date().toISOString().slice(0, 16));
    }
    prevExitRef.current = exit;
  }, [exit, closeTimestamp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setShowSymbolResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSymbols = symbols.filter(s => 
    s.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  const [showCalc, setShowCalc] = useState(false);
  const [riskPercent, setRiskPercent] = useState(1);
  const [calcResults, setCalcResults] = useState({ 
    riskAmt: 0, 
    slPct: 0, 
    margin: 0, 
    posValue: 0, 
    sugLev: 0 
  });

  const calculatePnl = (targetPrice: number) => {
    const e = parseFloat(entry);
    const m = parseFloat(marginInput);
    if (!e || isNaN(targetPrice) || !m) return null;
    const diff = direction === 'Long' ? (targetPrice - e) : (e - targetPrice);
    const pnlPct = (diff / e) * leverage * 100;
    const pnlAmt = m * (pnlPct / 100);
    return { pct: pnlPct, amt: pnlAmt };
  };

  useEffect(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    if (e && s && activeAccount) {
      const slDistPct = (Math.abs(e - s) / e);
      const riskAmt = activeAccount.currentBalance * (riskPercent / 100);
      const totalSlPct = slDistPct * leverage * 100;
      const reasonableMargin = riskAmt / (slDistPct * leverage);
      const reasonablePosValue = reasonableMargin * leverage;
      const suggestedLev = reasonablePosValue / activeAccount.currentBalance;

      setCalcResults({
        riskAmt,
        slPct: totalSlPct,
        margin: reasonableMargin,
        posValue: reasonablePosValue,
        sugLev: suggestedLev
      });
    }
  }, [entry, sl, riskPercent, leverage, activeAccount]);

  useEffect(() => {
    const res = calculatePnl(parseFloat(exit));
    if (res) {
      setPnlPreview(res.pct);
      setPnlAmountPreview(res.amt);
    } else {
      setPnlPreview(0);
      setPnlAmountPreview(0);
    }
  }, [entry, exit, direction, leverage, marginInput]);

  const adjustLeverage = (val: number) => {
    setLeverage(prev => Math.max(1, Math.min(150, prev + val)));
  };

  const addTp = () => {
    if(!newTpPrice) return;
    setTps([...tps, { id: Math.random().toString(36).substr(2, 5), price: parseFloat(newTpPrice), status: 'pending' }]);
    setNewTpPrice('');
  };

  const removeTp = (id: string) => setTps(tps.filter(tp => tp.id !== id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSnapshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !accountId || !marginInput || !symbol) return;

    const eVal = parseFloat(entry);
    const exVal = parseFloat(exit);
    const mVal = parseFloat(marginInput);
    
    const newTrade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date(timestamp).toISOString(),
      closeTimestamp: !isNaN(exVal) ? new Date(closeTimestamp).toISOString() : undefined,
      symbol,
      direction,
      leverage,
      entry: eVal,
      exit: isNaN(exVal) ? undefined : exVal,
      sl: parseFloat(sl) || 0,
      tps,
      pnlPercentage: pnlPreview,
      pnlAmount: pnlAmountPreview,
      review,
      snapshot,
      strategy,
      accountId,
      positionSize: mVal,
      positionUnit: 'Margin',
      status: isNaN(exVal) ? 'Active' : 'Closed'
    };

    onAddTrade(newTrade);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-8 pb-40 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">{editingTrade ? t.update : t.log}</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{symbol || 'Market'} Operation</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowCalc(!showCalc)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${showCalc ? 'bg-[#00FFFF] text-black border-[#00FFFF]' : 'text-zinc-400 border-zinc-800 bg-[#0A0A0A]'}`}
        >
          {t.calculator}
        </button>
      </div>

      {showCalc && (
        <div className="p-5 bg-[#0A0A0A] border border-[#00FFFF]/40 rounded-3xl space-y-6 animate-in slide-in-from-top-4 shadow-2xl">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">{t.calculator}</span>
              <div className="text-[10px] font-black text-zinc-600 uppercase">Equity: {activeAccount.currentBalance.toFixed(2)}</div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-zinc-500 uppercase">{t.riskPercent}</label>
                 <div className="flex items-center gap-3">
                    <input type="range" min="0.1" max="10" step="0.1" value={riskPercent} onChange={e => setRiskPercent(parseFloat(e.target.value))} className="flex-1 accent-[#00FFFF]" />
                    <span className="text-[#00FFFF] font-mono text-xs w-10">{riskPercent}%</span>
                 </div>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
                 <div className="text-[8px] text-zinc-500 font-black uppercase mb-1">{t.riskAmt}</div>
                 <div className="text-sm font-mono font-black text-white">{calcResults.riskAmt.toFixed(2)} u</div>
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <CalcResult label={t.slPct} value={`${calcResults.slPct.toFixed(2)}%`} color="text-red-400" />
              <CalcResult label={t.suggestedMargin} value={`${calcResults.margin.toFixed(2)}u`} color="text-[#00FFFF]" />
              <CalcResult label={t.posValue} value={`${calcResults.posValue.toFixed(1)}u`} color="text-purple-400" />
              <CalcResult label={t.suggestedLev} value={`${calcResults.sugLev.toFixed(1)}x`} color="text-gold" />
           </div>

           <button type="button" onClick={() => { setMarginInput(calcResults.margin.toFixed(2)); setShowCalc(false); }} className="w-full py-3.5 bg-[#00FFFF] text-black rounded-xl text-[10px] font-black uppercase">
             Apply Recommended Margin
           </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Responsive grid for Entry/Close Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.entryTime}</label>
            <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#00FFFF] transition-colors appearance-none" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest px-1">{t.closeTime}</label>
            <input type="datetime-local" value={closeTimestamp} onChange={e => setCloseTimestamp(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#00FFFF]/30 rounded-2xl px-4 py-3 text-sm text-[#00FFFF] font-bold outline-none focus:border-[#00FFFF] transition-colors appearance-none" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 relative" ref={symbolRef}>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.symbol}</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder={t.searchSymbol}
                value={symbolSearch}
                onChange={e => { setSymbolSearch(e.target.value); setSymbol(e.target.value); setShowSymbolResults(true); }}
                onFocus={() => setShowSymbolResults(true)}
                className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-3.5 font-bold outline-none focus:border-[#00FFFF] transition-colors placeholder:text-zinc-700 text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            
            {showSymbolResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden z-[60] shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map(s => (
                    <button 
                      key={s.id} 
                      type="button"
                      onClick={() => { setSymbol(s.name); setSymbolSearch(s.name); setShowSymbolResults(false); }}
                      className="w-full px-5 py-3 text-left hover:bg-[#00FFFF]/5 hover:text-[#00FFFF] transition-colors flex items-center justify-between group"
                    >
                      <span className="font-bold text-sm tracking-tight">{s.name}</span>
                      <span className="text-[8px] font-black uppercase text-zinc-600 group-hover:text-[#00FFFF]/50 tracking-widest">Symbol</span>
                    </button>
                  ))
                ) : (
                  <button 
                    type="button"
                    onClick={() => setShowSymbolResults(false)}
                    className="w-full px-5 py-3 text-left text-zinc-600 text-xs italic"
                  >
                    Use Custom: {symbolSearch}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.direction}</label>
            <div className="flex bg-[#0A0A0A] p-1.5 rounded-2xl border border-[#1A1A1A]">
              <button type="button" onClick={() => setDirection('Long')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'Long' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500'}`}>LONG</button>
              <button type="button" onClick={() => setDirection('Short')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'Short' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'text-zinc-500'}`}>SHORT</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.leverage} ({leverage}x)</label>
            <div className="flex gap-2">
               <button type="button" onClick={() => adjustLeverage(-1)} className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-800 transition-all">-</button>
               <button type="button" onClick={() => adjustLeverage(1)} className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-800 transition-all">+</button>
            </div>
          </div>
          <input type="range" min="1" max="150" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full h-1.5 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#00FFFF]" />
        </div>

        <div className="p-5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl space-y-4 shadow-xl">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-zinc-500 uppercase">{t.margin}</label>
              <div className="text-[9px] font-black text-[#00FFFF] uppercase bg-[#00FFFF]/5 px-2 py-1 rounded tracking-tight">Value: {((parseFloat(marginInput) || 0) * leverage).toFixed(2)} USDT</div>
           </div>
           <input type="number" step="any" placeholder="Principal (Margin)" value={marginInput} onChange={e => setMarginInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-4 font-mono text-white text-lg focus:border-[#00FFFF] outline-none transition-all shadow-inner" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase px-1">{t.entry}</label>
            <input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-4 py-3.5 font-mono outline-none focus:border-[#00FFFF] transition-all text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest px-1">{t.exit}</label>
            <input type="number" step="any" placeholder="Target Exit" value={exit} onChange={e => setExit(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#00FFFF]/20 rounded-2xl px-4 py-3.5 font-mono text-[#00FFFF] outline-none focus:border-[#00FFFF] transition-all text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-500 uppercase px-1">{t.sl}</label>
            <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} className="w-full bg-[#0A0A0A] border border-red-900/30 rounded-2xl px-4 py-3.5 font-mono text-red-500 outline-none focus:border-red-500 transition-all text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-500 uppercase px-1">{t.tp}</label>
            <div className="flex gap-2">
              <input type="number" step="any" value={newTpPrice} onChange={e => setNewTpPrice(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-emerald-900/30 rounded-2xl px-4 py-3.5 font-mono outline-none focus:border-emerald-500 transition-all text-sm" placeholder="Target" />
              <button type="button" onClick={addTp} className="bg-emerald-500 text-black w-12 h-12 rounded-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Snapshot (Chart)</label>
          <div className="relative group">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="w-full h-40 bg-[#0A0A0A] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden bg-center bg-cover group-hover:border-[#00FFFF]/50" style={snapshot ? { backgroundImage: `url(${snapshot})` } : {}}>
              {!snapshot && <div className="text-center"><span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block">Upload Chart Snapshot</span></div>}
              {snapshot && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black uppercase tracking-widest text-white">Change Image</span></div>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase px-1">{t.review}</label>
          <textarea rows={6} value={review} onChange={e => setReview(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-4 py-4 text-[11px] resize-none outline-none focus:border-[#00FFFF] font-mono leading-relaxed transition-all" />
        </div>

        {pnlPreview !== 0 && (
          <div className="p-5 rounded-[2rem] border border-[#1A1A1A] bg-[#0A0A0A] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trade Performance</span>
              <span className={`text-2xl md:text-3xl font-mono font-black ${pnlPreview >= 0 ? 'text-[#00FFFF]' : 'text-red-500'}`}>
                {pnlPreview > 0 ? '+' : ''}{pnlPreview.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${pnlPreview >= 0 ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                {pnlPreview >= 0 ? 'WIN' : 'LOSS'}
              </div>
              <span className="text-[10px] font-mono text-zinc-600 font-bold">{pnlAmountPreview.toFixed(2)} USDT</span>
            </div>
          </div>
        )}

        <button type="submit" className="w-full py-4.5 bg-[#00FFFF] text-black font-black uppercase tracking-widest rounded-3xl shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:scale-[0.98] active:scale-[0.95] transition-all text-sm h-14">
          {editingTrade ? t.update : t.submit}
        </button>
      </form>
    </div>
  );
};

const CalcResult: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-0.5 flex-1 flex flex-col items-center justify-center">
     <div className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter text-center">{label}</div>
     <div className={`text-xs font-mono font-black ${color}`}>{value}</div>
  </div>
);

export default LogTrade;

import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS, REVIEW_TEMPLATE } from '../constants';
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
  const activeAccount = accounts.find(a => a.id === (editingTrade?.accountId || accounts[0]?.id)) || accounts[0];
  
  const [accountId, setAccountId] = useState(editingTrade?.accountId || accounts[0]?.id || '');
  const [symbol, setSymbol] = useState(editingTrade?.symbol || symbols[0]?.name || '');
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

  const [pnlPreview, setPnlPreview] = useState(0);
  const [pnlAmountPreview, setPnlAmountPreview] = useState(0);

  const prevExitRef = useRef(exit);
  const symbolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exit && !prevExitRef.current && !closeTimestamp) {
      setCloseTimestamp(new Date().toISOString().slice(0, 16));
    }
    prevExitRef.current = exit;
  }, [exit, closeTimestamp]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setShowSymbolResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSymbols = symbols.filter(s => 
    s.name.toLowerCase().includes(symbolSearch.toLowerCase())
  );

  const [showCalc, setShowCalc] = useState(false);
  const [riskPercent, setRiskPercent] = useState(1);
  const [calcResults, setCalcResults] = useState({ 
    riskAmt: 0, 
    slPct: 0, 
    margin: 0, 
    posValue: 0, 
    sugLev: 0 
  });

  const calculatePnl = (targetPrice: number) => {
    const e = parseFloat(entry);
    const m = parseFloat(marginInput);
    if (!e || isNaN(targetPrice) || !m) return null;
    const diff = direction === 'Long' ? (targetPrice - e) : (e - targetPrice);
    const pnlPct = (diff / e) * leverage * 100;
    const pnlAmt = m * (pnlPct / 100);
    return { pct: pnlPct, amt: pnlAmt };
  };

  useEffect(() => {
    const e = parseFloat(entry);
    const s = parseFloat(sl);
    if (e && s && activeAccount) {
      const slDistPct = (Math.abs(e - s) / e);
      const riskAmt = activeAccount.currentBalance * (riskPercent / 100);
      const totalSlPct = slDistPct * leverage * 100;
      const reasonableMargin = riskAmt / (slDistPct * leverage);
      const reasonablePosValue = reasonableMargin * leverage;
      const suggestedLev = reasonablePosValue / activeAccount.currentBalance;

      setCalcResults({
        riskAmt,
        slPct: totalSlPct,
        margin: reasonableMargin,
        posValue: reasonablePosValue,
        sugLev: suggestedLev
      });
    }
  }, [entry, sl, riskPercent, leverage, activeAccount]);

  useEffect(() => {
    const res = calculatePnl(parseFloat(exit));
    if (res) {
      setPnlPreview(res.pct);
      setPnlAmountPreview(res.amt);
    } else {
      setPnlPreview(0);
      setPnlAmountPreview(0);
    }
  }, [entry, exit, direction, leverage, marginInput]);

  const adjustLeverage = (val: number) => {
    setLeverage(prev => Math.max(1, Math.min(150, prev + val)));
  };

  const addTp = () => {
    if(!newTpPrice) return;
    setTps([...tps, { id: Math.random().toString(36).substr(2, 5), price: parseFloat(newTpPrice), status: 'pending' }]);
    setNewTpPrice('');
  };

  const removeTp = (id: string) => setTps(tps.filter(tp => tp.id !== id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSnapshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !accountId || !marginInput || !symbol) return;

    const eVal = parseFloat(entry);
    const exVal = parseFloat(exit);
    const mVal = parseFloat(marginInput);
    
    const newTrade: Trade = {
      id: editingTrade?.id || Math.random().toString(36).substr(2, 9),
      timestamp: new Date(timestamp).toISOString(),
      closeTimestamp: !isNaN(exVal) ? new Date(closeTimestamp).toISOString() : undefined,
      symbol,
      direction,
      leverage,
      entry: eVal,
      exit: isNaN(exVal) ? undefined : exVal,
      sl: parseFloat(sl) || 0,
      tps,
      pnlPercentage: pnlPreview,
      pnlAmount: pnlAmountPreview,
      review,
      snapshot,
      strategy,
      accountId,
      positionSize: mVal,
      positionUnit: 'Margin',
      status: isNaN(exVal) ? 'Active' : 'Closed'
    };

    onAddTrade(newTrade);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-8 pb-40 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">{editingTrade ? t.update : t.log}</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{symbol || 'Market'} Operation</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowCalc(!showCalc)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${showCalc ? 'bg-[#00FFFF] text-black border-[#00FFFF]' : 'text-zinc-400 border-zinc-800 bg-[#0A0A0A]'}`}
        >
          {t.calculator}
        </button>
      </div>

      {showCalc && (
        <div className="p-5 bg-[#0A0A0A] border border-[#00FFFF]/40 rounded-3xl space-y-6 animate-in slide-in-from-top-4 shadow-2xl">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">{t.calculator}</span>
              <div className="text-[10px] font-black text-zinc-600 uppercase">Equity: {activeAccount.currentBalance.toFixed(2)}</div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-zinc-500 uppercase">{t.riskPercent}</label>
                 <div className="flex items-center gap-3">
                    <input type="range" min="0.1" max="10" step="0.1" value={riskPercent} onChange={e => setRiskPercent(parseFloat(e.target.value))} className="flex-1 accent-[#00FFFF]" />
                    <span className="text-[#00FFFF] font-mono text-xs w-10">{riskPercent}%</span>
                 </div>
              </div>
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
                 <div className="text-[8px] text-zinc-500 font-black uppercase mb-1">{t.riskAmt}</div>
                 <div className="text-sm font-mono font-black text-white">{calcResults.riskAmt.toFixed(2)} u</div>
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <CalcResult label={t.slPct} value={`${calcResults.slPct.toFixed(2)}%`} color="text-red-400" />
              <CalcResult label={t.suggestedMargin} value={`${calcResults.margin.toFixed(2)}u`} color="text-[#00FFFF]" />
              <CalcResult label={t.posValue} value={`${calcResults.posValue.toFixed(1)}u`} color="text-purple-400" />
              <CalcResult label={t.suggestedLev} value={`${calcResults.sugLev.toFixed(1)}x`} color="text-gold" />
           </div>

           <button type="button" onClick={() => { setMarginInput(calcResults.margin.toFixed(2)); setShowCalc(false); }} className="w-full py-3.5 bg-[#00FFFF] text-black rounded-xl text-[10px] font-black uppercase">
             Apply Recommended Margin
           </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Responsive grid for Entry/Close Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.entryTime}</label>
            <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#00FFFF] transition-colors appearance-none" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest px-1">{t.closeTime}</label>
            <input type="datetime-local" value={closeTimestamp} onChange={e => setCloseTimestamp(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#00FFFF]/30 rounded-2xl px-4 py-3 text-sm text-[#00FFFF] font-bold outline-none focus:border-[#00FFFF] transition-colors appearance-none" style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 relative" ref={symbolRef}>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.symbol}</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder={t.searchSymbol}
                value={symbolSearch}
                onChange={e => { setSymbolSearch(e.target.value); setSymbol(e.target.value); setShowSymbolResults(true); }}
                onFocus={() => setShowSymbolResults(true)}
                className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl px-4 py-3.5 font-bold outline-none focus:border-[#00FFFF] transition-colors placeholder:text-zinc-700 text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            
            {showSymbolResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden z-[60] shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map(s => (
                    <button 
                      key={s.id} 
                      type="button"
                      onClick={() => { setSymbol(s.name); setSymbolSearch(s.name); setShowSymbolResults(false); }}
                      className="w-full px-5 py-3 text-left hover:bg-[#00FFFF]/5 hover:text-[#00FFFF] transition-colors flex items-center justify-between group"
                    >
                      <span className="font-bold text-sm tracking-tight">{s.name}</span>
                      <span className="text-[8px] font-black uppercase text-zinc-600 group-hover:text-[#00FFFF]/50 tracking-widest">Symbol</span>
                    </button>
                  ))
                ) : (
                  <button 
                    type="button"
                    onClick={() => setShowSymbolResults(false)}
                    className="w-full px-5 py-3 text-left text-zinc-600 text-xs italic"
                  >
                    Use Custom: {symbolSearch}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{t.direction}</label>
            <div className="flex bg-[#0A0A0A] p-1.5 rounded-2xl border border-[#1A1A1A]">
              <button type="button" onClick={() => setDirection('Long')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'Long' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500'}`}>LONG</button>
              <button type="button" onClick={() => setDirection('Short')} className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${direction === 'Short' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'text-zinc-500'}`}>SHORT</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.leverage} ({leverage}x)</label>
            <div className="flex gap-2">
               <button type="button" onClick={() => adjustLeverage(-1)} className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-800 transition-all">-</button>
               <button type="button" onClick={() => adjustLeverage(1)} className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-800 transition-all">+</button>
            </div>
          </div>
          <input type="range" min="1" max="150" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full h-1.5 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#00FFFF]" />
        </div>

        <div className="p-5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl space-y-4 shadow-xl">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-zinc-500 uppercase">{t.margin}</label>
              <div className="text-[9px] font-black text-[#00FFFF] uppercase bg-[#00FFFF]/5 px-2 py-1 rounded tracking-tight">Value: {((parseFloat(marginInput) || 0) * leverage).toFixed(2)} USDT</div>
           </div>
           <input type="number" step="any" placeholder="Principal (Margin)" value={marginInput} onChange={e => setMarginInput(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-4 py-4 font-mono text-white text-lg focus:border-[#00FFFF] outline-none transition-all shadow-inner" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase px-1">{t.entry}</label>
            <input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-4 py-3.5 font-mono outline-none focus:border-[#00FFFF] transition-all text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest px-1">{t.exit}</label>
            <input type="number" step="any" placeholder="Target Exit" value={exit} onChange={e => setExit(e.target.value)} className="w-full bg-[#0A0A0A] border border-[#00FFFF]/20 rounded-2xl px-4 py-3.5 font-mono text-[#00FFFF] outline-none focus:border-[#00FFFF] transition-all text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-red-500 uppercase px-1">{t.sl}</label>
            <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} className="w-full bg-[#0A0A0A] border border-red-900/30 rounded-2xl px-4 py-3.5 font-mono text-red-500 outline-none focus:border-red-500 transition-all text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-emerald-500 uppercase px-1">{t.tp}</label>
            <div className="flex gap-2">
              <input type="number" step="any" value={newTpPrice} onChange={e => setNewTpPrice(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-emerald-900/30 rounded-2xl px-4 py-3.5 font-mono outline-none focus:border-emerald-500 transition-all text-sm" placeholder="Target" />
              <button type="button" onClick={addTp} className="bg-emerald-500 text-black w-12 h-12 rounded-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all">+</button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Snapshot (Chart)</label>
          <div className="relative group">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="w-full h-40 bg-[#0A0A0A] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden bg-center bg-cover group-hover:border-[#00FFFF]/50" style={snapshot ? { backgroundImage: `url(${snapshot})` } : {}}>
              {!snapshot && <div className="text-center"><span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block">Upload Chart Snapshot</span></div>}
              {snapshot && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-black uppercase tracking-widest text-white">Change Image</span></div>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase px-1">{t.review}</label>
          <textarea rows={6} value={review} onChange={e => setReview(e.target.value)} className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-4 py-4 text-[11px] resize-none outline-none focus:border-[#00FFFF] font-mono leading-relaxed transition-all" />
        </div>

        {pnlPreview !== 0 && (
          <div className="p-5 rounded-[2rem] border border-[#1A1A1A] bg-[#0A0A0A] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trade Performance</span>
              <span className={`text-2xl md:text-3xl font-mono font-black ${pnlPreview >= 0 ? 'text-[#00FFFF]' : 'text-red-500'}`}>
                {pnlPreview > 0 ? '+' : ''}{pnlPreview.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${pnlPreview >= 0 ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                {pnlPreview >= 0 ? 'WIN' : 'LOSS'}
              </div>
              <span className="text-[10px] font-mono text-zinc-600 font-bold">{pnlAmountPreview.toFixed(2)} USDT</span>
            </div>
          </div>
        )}

        <button type="submit" className="w-full py-4.5 bg-[#00FFFF] text-black font-black uppercase tracking-widest rounded-3xl shadow-[0_0_30px_rgba(0,255,255,0.25)] hover:scale-[0.98] active:scale-[0.95] transition-all text-sm h-14">
          {editingTrade ? t.update : t.submit}
        </button>
      </form>
    </div>
  );
};

const CalcResult: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-0.5 flex-1 flex flex-col items-center justify-center">
     <div className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter text-center">{label}</div>
     <div className={`text-xs font-mono font-black ${color}`}>{value}</div>
  </div>
);

export default LogTrade;

