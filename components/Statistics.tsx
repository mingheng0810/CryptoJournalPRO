
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Trade, Language, Account } from '../types';
import { TRANSLATIONS } from '../constants';

interface StatisticsProps {
  trades: Trade[];
  accounts: Account[];
  lang: Language;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-md border border-[#00FFFF]/30 p-4 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black font-mono text-[#00FFFF]">
          ${payload[0].value.toFixed(2)} <span className="text-[10px] text-zinc-600 ml-1">USDT</span>
        </p>
      </div>
    );
  }
  return null;
};

const Statistics: React.FC<StatisticsProps> = ({ trades, accounts, lang }) => {
  const t = TRANSLATIONS[lang];
  const [showValue, setShowValue] = useState(true);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [activeQuickRange, setActiveQuickRange] = useState<string>('All');

  const { stats, equityCurve, fullPeriodBalance, startRangeDate, endRangeDate } = useMemo(() => {
    const account: Account = accounts[0];
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
    const curve: any[] = [];
    
    // 初始化起點 (Start Point)
    if (fromDate) {
        const priorTrades = sortedTrades.filter(t => new Date(t.timestamp).toISOString().split('T')[0] < fromDate);
        priorTrades.forEach(pt => {
            if (pt.status === 'Closed') currentCurveBalance += pt.pnlAmount;
        });
        curve.push({ date: fromDate, value: currentCurveBalance });
    } else {
        curve.push({ date: 'START', value: initialBalance });
    }

    filteredTrades.forEach(trade => {
      if (trade.status === 'Closed') {
        currentCurveBalance += trade.pnlAmount;
        curve.push({ date: new Date(trade.timestamp).toLocaleDateString(), value: currentCurveBalance });
      }
    });

    // 如果只有一個點，增加一個微小的位移點讓圖表能畫出網格與軸線
    if (curve.length === 1) {
      curve.push({ date: 'END', value: curve[0].value });
    }

    const closedTradesInRange = filteredTrades.filter(t => t.status === 'Closed');
    const winRate = closedTradesInRange.length > 0 
      ? (closedTradesInRange.filter(tr => tr.pnlAmount > 0).length / closedTradesInRange.length) * 100 
      : 0;

    return { 
      stats: { winRate, total: filteredTrades.length },
      equityCurve: curve,
      fullPeriodBalance: initialBalance + totalRealizedPnl,
      startRangeDate: curve[0]?.date || '---',
      endRangeDate: curve[curve.length - 1]?.date || '---'
    };
  }, [trades, accounts, fromDate, toDate]);

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

      <section className="flex flex-wrap justify-center bg-zinc-950/40 p-1.5 rounded-2xl border border-zinc-900/50 w-fit mx-auto gap-1">
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

      <div className="flex justify-between px-2 -mb-8 relative z-10 pointer-events-none">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Start Period</span>
          <span className="text-[10px] font-mono text-zinc-500">{startRangeDate}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Current Scope</span>
          <span className="text-[10px] font-mono text-zinc-500">{endRangeDate}</span>
        </div>
      </div>

      <section className="h-80 relative bg-[#050505] rounded-[2.5rem] border border-zinc-900/80 overflow-hidden shadow-2xl">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 80, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              {/* 貫穿全框的灰色虛線網格 */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#1A1A1A" 
                vertical={true} 
                horizontal={true}
              />

              {/* X軸: 鎖定左右貼齊 */}
              {/* Fix: removed boundaryGap as it is not a valid prop for XAxis in recharts */}
              <XAxis 
                dataKey="date" 
                hide 
              />

              {/* Y軸: 鎖定數據最小值在底端 */}
              <YAxis 
                hide 
                domain={['dataMin', 'auto']}
              />

              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#00FFFF', strokeWidth: 1, strokeDasharray: '5 5' }} 
                isAnimationActive={false}
              />

              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#00FFFF" 
                strokeWidth={3} 
                fill="url(#chartGlow)" 
                animationDuration={1500}
                activeDot={{ 
                  r: 6, 
                  fill: '#00FFFF', 
                  stroke: '#000', 
                  strokeWidth: 2,
                  className: "filter drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]"
                }}
                connectNulls
              />
            </AreaChart>
         </ResponsiveContainer>
      </section>

      <section className="bg-zinc-900/10 border border-zinc-900/60 rounded-[2.5rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1">自</label>
            <input type="date" value={fromDate} onChange={e => {setFromDate(e.target.value); setActiveQuickRange('Custom');}} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-white outline-none focus:border-[#00FFFF]/30 transition-all appearance-none" style={{ colorScheme: 'dark' }} />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1">至</label>
            <input type="date" value={toDate} onChange={e => {setToDate(e.target.value); setActiveQuickRange('Custom');}} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-mono text-white outline-none focus:border-[#00FFFF]/30 transition-all appearance-none" style={{ colorScheme: 'dark' }} />
         </div>
      </section>

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
