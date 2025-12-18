
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trade, Language, Account } from '../types';
import { THEME_COLORS, TRANSLATIONS, INITIAL_ACCOUNTS } from '../constants';

interface StatisticsProps {
  trades: Trade[];
  lang: Language;
}

const Statistics: React.FC<StatisticsProps> = ({ trades, lang }) => {
  const t = TRANSLATIONS[lang];
  const [showValue, setShowValue] = useState(true);
  
  // Date range states
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeQuickRange, setActiveQuickRange] = useState<string>('All');

  const { stats, equityCurve, dailyPnl, fullPeriodBalance } = useMemo(() => {
    const storedAccs = localStorage.getItem('crypto_journal_accounts_v4');
    const account: Account = storedAccs ? JSON.parse(storedAccs)[0] : INITIAL_ACCOUNTS[0];
    const initialBalance = account?.initialBalance || 0;

    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    let totalRealizedBalance = initialBalance;
    sortedTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        totalRealizedBalance += trade.pnlAmount;
      }
    });

    const filteredTrades = sortedTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
      if (fromDate && tradeDate < fromDate) return false;
      if (toDate && tradeDate > toDate) return false;
      return true;
    });

    let rangeStartBalance = initialBalance;
    if (fromDate) {
      sortedTrades.forEach(trade => {
        const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
        if (tradeDate < fromDate && trade.status === 'Closed') {
          rangeStartBalance += trade.pnlAmount;
        }
      });
    }

    let currentCurveBalance = rangeStartBalance;
    const curve = [{ date: 'Start', value: rangeStartBalance }];
    
    filteredTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        currentCurveBalance += trade.pnlAmount;
        curve.push({ 
          date: new Date(trade.timestamp).toLocaleDateString(), 
          value: currentCurveBalance 
        });
      }
    });

    const dailyMap = new Map<string, number>();
    filteredTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        const day = new Date(trade.timestamp).toISOString().split('T')[0];
        dailyMap.set(day, (dailyMap.get(day) || 0) + trade.pnlAmount);
      }
    });

    const closedTradesInRange = filteredTrades.filter(t => t.status === 'Closed');
    const winRate = closedTradesInRange.length > 0 
      ? (closedTradesInRange.filter(tr => tr.pnlAmount > 0).length / closedTradesInRange.length) * 100 
      : 0;
    
    return { 
      stats: { winRate, total: filteredTrades.length, balance: totalRealizedBalance },
      equityCurve: curve,
      dailyPnl: dailyMap,
      fullPeriodBalance: totalRealizedBalance
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

  const renderCalendar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} className="h-10"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const pnl = dailyPnl.get(dateStr) || 0;
      cells.push(
        <div key={day} className={`h-10 flex flex-col items-center justify-center rounded-lg text-[9px] font-bold border transition-all ${pnl > 0 ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : pnl < 0 ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
          {day}
          {pnl !== 0 && <span className="mt-0.5 scale-90">{pnl > 0 ? '+' : ''}{pnl.toFixed(0)}</span>}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-black mb-2">{d}</div>)}
        {cells}
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-10 max-w-4xl mx-auto pb-32 animate-in fade-in duration-700">
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="animate-in slide-in-from-left-4">
              <div className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                {t.totalAsset} (Realized)
                <button onClick={() => setShowValue(!showValue)} className="hover:text-[#00FFFF] transition-colors p-1">
                  {showValue ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                  )}
                </button>
              </div>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-5xl md:text-6xl font-black font-mono tracking-tighter transition-all">
                  {showValue ? fullPeriodBalance.toFixed(2) : '••••••'}
                </span>
                <span className="text-zinc-500 text-lg font-black tracking-widest uppercase">USDT</span>
              </div>
           </div>
        </div>

        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-right-2">
           {[
             { label: '7日', val: 7 },
             { label: '30日', val: 30 },
             { label: '90日', val: 90 },
             { label: '180日', val: 180 },
             { label: t.allTime, val: 'All' }
           ].map(q => (
             <button 
                key={q.label}
                onClick={() => handleQuickRange(q.val as any)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeQuickRange === q.val.toString() ? 'bg-[#00FFFF] text-black border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-[#0A0A0A] text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
             >
               {q.label}
             </button>
           ))}
        </div>

        {/* Custom Date Range Picker - Adjusted for mobile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl animate-in fade-in duration-1000 overflow-hidden">
           <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">{t.fromDate}</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => { setFromDate(e.target.value); setActiveQuickRange('Custom'); }}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#00FFFF] appearance-none"
                style={{ colorScheme: 'dark' }}
              />
           </div>
           <div className="space-y-1">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">{t.toDate}</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => { setToDate(e.target.value); setActiveQuickRange('Custom'); }}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[#00FFFF] appearance-none"
                style={{ colorScheme: 'dark' }}
              />
           </div>
        </div>

        <div className="h-64 relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#050505] shadow-inner">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#00FFFF]/10 to-transparent pointer-events-none" style={{ perspective: '200px', transform: 'rotateX(20deg)' }}>
            <div className="w-full h-full" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)' }}></div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME_COLORS.cyan} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={THEME_COLORS.cyan} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={THEME_COLORS.cyan} 
                strokeWidth={5} 
                fill="url(#glow)" 
                animationDuration={2500} 
                isAnimationActive={true} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">{t.dailyPnl} Activity Map</h3>
        <div className="overflow-x-auto">
          {renderCalendar()}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard label={t.winRate} value={`${stats.winRate.toFixed(1)}%`} color="text-emerald-400" />
        <MetricCard label={t.totalTrades} value={stats.total.toString()} color="text-white" />
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 md:p-8 space-y-1 shadow-xl">
    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{label}</div>
    <div className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default Statistics;
