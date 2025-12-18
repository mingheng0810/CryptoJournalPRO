
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { Trade, Language, Account } from '../types';
import { THEME_COLORS, TRANSLATIONS, INITIAL_ACCOUNTS } from '../constants';

interface StatisticsProps {
  trades: Trade[];
  lang: Language;
}

const Statistics: React.FC<StatisticsProps> = ({ trades, lang }) => {
  const t = TRANSLATIONS[lang];
  const [showValue, setShowValue] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeQuickRange, setActiveQuickRange] = useState<string>('All');

  const { stats, equityCurve, fullPeriodBalance } = useMemo(() => {
    const storedAccs = localStorage.getItem('crypto_journal_accounts_v4');
    const account: Account = storedAccs ? JSON.parse(storedAccs)[0] : INITIAL_ACCOUNTS[0];
    const initialBalance = account?.initialBalance || 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let totalRealizedPnl = 0;
    sortedTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        totalRealizedPnl += trade.pnlAmount;
      }
    });

    const filteredTrades = sortedTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
      if (fromDate && tradeDate < fromDate) return false;
      if (toDate && tradeDate > toDate) return false;
      return true;
    });

    let currentCurveBalance = initialBalance;
    const curve = [{ date: 'Start', value: initialBalance }];
    filteredTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        currentCurveBalance += trade.pnlAmount;
        curve.push({ date: new Date(trade.timestamp).toLocaleDateString(), value: currentCurveBalance });
      }
    });

    const closedTradesInRange = filteredTrades.filter(t => t.status === 'Closed');
    const winRate = closedTradesInRange.length > 0 
      ? (closedTradesInRange.filter(tr => tr.pnlAmount > 0).length / closedTradesInRange.length) * 100 
      : 0;
    
    return { 
      stats: { winRate, total: filteredTrades.length },
      equityCurve: curve,
      fullPeriodBalance: initialBalance + totalRealizedPnl
    };
  }, [trades, fromDate, toDate]);

  const handleQuickRange = (days: number | 'All') => {
    setActiveQuickRange(days === 'All' ? 'All' : days.toString());
    if (days === 'All') {
      setFromDate('');
      setToDate('');
    } else {
      const start = new Date();
      start.setDate(start.getDate() - days);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(new Date().toISOString().split('T')[0]);
    }
  };

  return (
    <div className="px-6 py-8 space-y-10 max-w-4xl mx-auto pb-40 animate-in fade-in duration-700">
      {/* Total Asset Valuation - Exact match to Screenshot */}
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <span>總資產估值 (REALIZED)</span>
          <button onClick={() => setShowValue(!showValue)} className="hover:text-[#00FFFF] transition-colors">
            {showValue ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
            )}
          </button>
        </div>
        <div className="flex items-baseline justify-center gap-4">
          <span className="text-7xl font-[900] font-sans tracking-tighter">
            {showValue ? fullPeriodBalance.toFixed(2) : '••••••'}
          </span>
          <span className="text-zinc-500 text-2xl font-black tracking-widest uppercase">USDT</span>
        </div>
      </section>

      {/* Quick Range Selector - Exact style from Screenshot */}
      <section className="flex justify-center bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-900/50 w-fit mx-auto gap-1">
         {[
           { label: '7日', val: 7 },
           { label: '30日', val: 30 },
           { label: '90日', val: 90 },
           { label: '180日', val: 180 },
           { label: '至今為止', val: 'All' }
         ].map(q => (
           <button 
              key={q.label}
              onClick={() => handleQuickRange(q.val as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${activeQuickRange === q.val.toString() ? 'bg-[#00FFFF] text-black border-[#00FFFF] shadow-[0_0_25px_rgba(0,255,255,0.4)]' : 'bg-transparent text-zinc-600 border-zinc-900 hover:border-zinc-800'}`}
           >
             {q.label}
           </button>
         ))}
      </section>

      {/* Date Range Picker - Exact match to Screenshot */}
      <section className="bg-zinc-900/10 border border-zinc-900/60 rounded-[2.5rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1">自</label>
            <div className="relative group">
              <input type="date" value={fromDate} onChange={e => {setFromDate(e.target.value); setActiveQuickRange('Custom');}} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-white outline-none focus:border-[#00FFFF]/30 transition-all appearance-none" style={{ colorScheme: 'dark' }} />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700 group-focus-within:text-[#00FFFF]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
              </div>
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1">至</label>
            <div className="relative group">
              <input type="date" value={toDate} onChange={e => {setToDate(e.target.value); setActiveQuickRange('Custom');}} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-white outline-none focus:border-[#00FFFF]/30 transition-all appearance-none" style={{ colorScheme: 'dark' }} />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700 group-focus-within:text-[#00FFFF]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
              </div>
            </div>
         </div>
      </section>

      {/* Chart Section */}
      <section className="h-72 relative bg-zinc-950/20 rounded-[3rem] border border-zinc-900/50 overflow-hidden">
         <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 255, 0.05) 0%, transparent 100%)' }}></div>
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#00FFFF" strokeWidth={3} fill="url(#chartGlow)" animationDuration={1500} />
            </AreaChart>
         </ResponsiveContainer>
      </section>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <MetricBox label="勝率" value={`${stats.winRate.toFixed(1)}%`} color="text-emerald-400" />
        <MetricBox label="總執行次數" value={stats.total.toString()} />
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="bg-zinc-950/40 border border-zinc-900/50 rounded-[2.5rem] p-8 text-center space-y-2">
    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</div>
    <div className={`text-3xl font-black font-sans tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default Statistics;

