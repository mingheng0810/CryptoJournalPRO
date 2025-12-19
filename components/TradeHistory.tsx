
import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { TRANSLATIONS } from '../constants';
import { getAITradeFeedback } from '../services/geminiService';

interface TradeHistoryProps {
  trades: Trade[];
  onUpdateTrade: (updatedTrade: Trade) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onUpdateTrade, onEditTrade, onDeleteTrade }) => {
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // 快速平倉專用狀態
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [quickExitPrice, setQuickExitPrice] = useState<string>('');

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return '---';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const handleConfirmQuickClose = (trade: Trade) => {
    const exitPrice = parseFloat(quickExitPrice);
    if (isNaN(exitPrice)) return;

    const diff = trade.direction === 'Long' ? (exitPrice - trade.entry) : (trade.entry - exitPrice);
    let pnlPercentage = 0;
    let pnlAmount = 0;

    if (trade.positionUnit === 'Margin') {
      pnlPercentage = (diff / trade.entry) * trade.leverage * 100;
      pnlAmount = trade.positionSize * (pnlPercentage / 100);
    } else {
      pnlAmount = diff * trade.positionSize;
      const estimatedMargin = (trade.positionSize * trade.entry) / trade.leverage;
      pnlPercentage = (pnlAmount / estimatedMargin) * 100;
    }

    const updatedTrade: Trade = {
      ...trade,
      status: 'Closed',
      exit: exitPrice,
      closeTimestamp: new Date().toISOString(),
      pnlPercentage,
      pnlAmount
    };

    onUpdateTrade(updatedTrade);
    setClosingTradeId(null);
    setQuickExitPrice('');
  };

  const pnlPreview = useMemo(() => {
    if (!closingTradeId) return null;
    const trade = trades.find(t => t.id === closingTradeId);
    const exitPrice = parseFloat(quickExitPrice);
    if (!trade || isNaN(exitPrice)) return null;

    const diff = trade.direction === 'Long' ? (exitPrice - trade.entry) : (trade.entry - exitPrice);
    let pnlPercentage = 0;
    let pnlAmount = 0;

    if (trade.positionUnit === 'Margin') {
      pnlPercentage = (diff / trade.entry) * trade.leverage * 100;
      pnlAmount = trade.positionSize * (pnlPercentage / 100);
    } else {
      pnlAmount = diff * trade.positionSize;
      const estimatedMargin = (trade.positionSize * trade.entry) / trade.leverage;
      pnlPercentage = (pnlAmount / estimatedMargin) * 100;
    }
    return { pnlPercentage, pnlAmount };
  }, [closingTradeId, quickExitPrice, trades]);

  const handleAIFeedback = async (trade: Trade) => {
    if (trade.aiFeedback) return;
    setLoadingAI(trade.id);
    const feedback = await getAITradeFeedback(trade);
    onUpdateTrade({ ...trade, aiFeedback: feedback });
    setLoadingAI(null);
  };

  const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500 animate-in fade-in duration-500">
        <div className="text-4xl opacity-20 mb-4">📭</div>
        <p className="font-black tracking-widest text-[10px] uppercase">No logs detected</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto pb-40">
      <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center mb-4">Protocol Archive</h2>
      {sortedTrades.map(trade => {
        const isExpanded = expandedId === trade.id;
        const isClosing = closingTradeId === trade.id;

        return (
          <div 
            key={trade.id} 
            className={`bg-[#0A0A0A] border ${trade.status === 'Active' ? 'border-[#00FFFF]/30 shadow-[0_0_20px_rgba(0,255,255,0.05)]' : 'border-[#1A1A1A]'} rounded-[1.5rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-[#00FFFF]/20 bg-zinc-950/20' : 'hover:border-zinc-700'}`}
          >
            <div 
              onClick={() => setExpandedId(isExpanded ? null : trade.id)}
              className="p-5 flex justify-between items-center cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${trade.status === 'Active' ? 'bg-[#00FFFF] animate-pulse' : trade.pnlPercentage >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-tighter leading-none">{trade.symbol}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${trade.direction === 'Long' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trade.direction} {trade.leverage}x
                    </span>
                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5 rounded">{trade.strategy}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  {trade.status === 'Closed' ? (
                    <div className={`text-lg font-black font-mono tracking-tighter ${trade.pnlPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.pnlPercentage > 0 ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                    </div>
                  ) : (
                    <span className="text-[9px] font-black text-[#00FFFF] uppercase tracking-widest px-2 py-0.5 bg-[#00FFFF]/10 rounded border border-[#00FFFF]/20">Active</span>
                  )}
                </div>
                <svg 
                  className={`w-4 h-4 text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#00FFFF]' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 pb-5 pt-2 space-y-6 border-t border-[#1A1A1A]/50 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DataBlock label="Entry" value={trade.entry.toLocaleString()} />
                  <DataBlock label="TP" value={trade.tp?.toLocaleString() || '---'} color="text-amber-400" />
                  <DataBlock label="Stop Loss" value={trade.sl.toLocaleString()} color="text-red-400" />
                  <DataBlock label="Exit" value={trade.exit?.toLocaleString() || '---'} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <DataBlock label="PNL (USDT)" value={trade.pnlAmount.toFixed(2)} color={trade.pnlAmount >= 0 ? "text-emerald-400" : "text-red-400"} />
                  <DataBlock label={trade.positionUnit === 'Margin' ? "Margin" : "Tokens"} value={`${trade.positionSize} ${trade.positionUnit === 'Margin' ? 'USDT' : ''}`} />
                  <DataBlock label="Duration" value={calculateDuration(trade.timestamp, trade.closeTimestamp)} />
                </div>

                {trade.snapshot && (
                   <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-black">
                      <img src={trade.snapshot} className="w-full h-auto max-h-[400px] object-contain" alt="Snapshot" />
                   </div>
                )}

                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Protocol Review</label>
                   <div className="p-4 bg-zinc-900/40 rounded-2xl text-[11px] text-zinc-400 leading-relaxed border border-zinc-800/50 whitespace-pre-wrap font-mono">
                      {trade.review}
                   </div>
                </div>

                {trade.aiFeedback && (
                  <div className="p-4 bg-[#00FFFF]/5 border border-[#00FFFF]/10 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-[#00FFFF] uppercase">
                      <span className="text-xs">✨</span> Psychological Reflection
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">"{trade.aiFeedback}"</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  {trade.status === 'Active' && !isClosing && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setClosingTradeId(trade.id); setQuickExitPrice(trade.entry.toString()); }}
                      className="w-full py-4 bg-[#00FFFF] text-black rounded-xl text-[12px] font-[900] uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Quick Close Position ⚡️
                    </button>
                  )}

                  {isClosing && (
                    <div className="p-5 bg-zinc-950 border border-[#00FFFF]/30 rounded-2xl space-y-4 animate-in zoom-in-95">
                       <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-[#00FFFF] uppercase tracking-widest">Execute Settlement Price</label>
                          {pnlPreview && (
                            <div className="text-right">
                               <span className={`text-[10px] font-black font-mono ${pnlPreview.pnlAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  Est. PNL: {pnlPreview.pnlAmount >= 0 ? '+' : ''}{pnlPreview.pnlAmount.toFixed(2)} USDT ({pnlPreview.pnlPercentage.toFixed(2)}%)
                               </span>
                            </div>
                          )}
                       </div>
                       <input 
                         autoFocus
                         type="number" 
                         step="any"
                         value={quickExitPrice} 
                         onChange={(e) => setQuickExitPrice(e.target.value)}
                         className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-lg font-mono text-white outline-none focus:border-[#00FFFF]"
                         placeholder="Enter Exit Price..."
                       />
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleConfirmQuickClose(trade)}
                            className="flex-[2] py-3 bg-[#00FFFF] text-black rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Confirm Settlement
                          </button>
                          <button 
                            onClick={() => setClosingTradeId(null)}
                            className="flex-1 py-3 bg-zinc-900 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                       </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => onEditTrade(trade)} 
                      className="flex-1 min-w-[100px] py-3 bg-[#1A1A1A] text-zinc-400 rounded-xl text-[10px] font-black uppercase hover:bg-[#00FFFF]/10 hover:text-[#00FFFF] transition-all border border-transparent hover:border-[#00FFFF]/20"
                    >
                      Edit Detail
                    </button>
                    <button 
                      onClick={() => handleAIFeedback(trade)}
                      disabled={loadingAI === trade.id || !!trade.aiFeedback}
                      className="flex-1 min-w-[100px] py-3 bg-[#1A1A1A] text-zinc-400 rounded-xl text-[10px] font-black uppercase disabled:opacity-50 transition-all hover:bg-zinc-800"
                    >
                      {loadingAI === trade.id ? 'Analyzing...' : trade.aiFeedback ? 'Reviewed' : 'AI Analysis'}
                    </button>
                    <button 
                      onClick={() => onDeleteTrade(trade.id)}
                      className="px-4 py-3 bg-red-950/20 text-red-500/50 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DataBlock: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "text-zinc-300" }) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{label}</label>
    <div className={`font-mono text-[10px] font-bold ${color}`}>{value}</div>
  </div>
);

export default TradeHistory;
