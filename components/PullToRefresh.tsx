
import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  lang: Language;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, lang }) => {
  const t = TRANSLATIONS[lang];
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pullThreshold = 80;
  const maxPull = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0 && !isRefreshing) {
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        // 增加阻尼感 (Damping)
        const damped = Math.min(maxPull, Math.pow(diff, 0.8) * 2);
        setPullDistance(damped);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);
      await onRefresh();
      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      setPullDistance(0);
    }
    startY.current = 0;
  };

  return (
    <div 
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉提示 UI */}
      <div 
        className="absolute left-0 right-0 flex flex-col items-center justify-center transition-all duration-300 overflow-hidden pointer-events-none"
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance / pullThreshold,
          top: 0
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border border-zinc-800 bg-black flex items-center justify-center transition-all duration-500 ${isRefreshing ? 'animate-spin border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.4)]' : ''}`}
               style={{ transform: `rotate(${pullDistance * 2}deg)` }}>
            <span className={`text-[10px] font-black transition-colors ${pullDistance >= pullThreshold ? 'text-[#00FFFF]' : 'text-zinc-600'}`}>MH</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">
            {isRefreshing ? t.refreshing : (pullDistance >= pullThreshold ? t.releaseToRefresh : t.pullToRefresh)}
          </span>
        </div>
      </div>

      {/* 主內容區塊 */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
