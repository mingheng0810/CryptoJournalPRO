
export type TradeDirection = 'Long' | 'Short';
export type Language = 'zh' | 'en';
export type TradeStatus = 'Active' | 'Closed';

export interface TakeProfit {
  id: string;
  price: number;
  status: 'pending' | 'hit';
}

export interface Trade {
  id: string;
  timestamp: string;
  closeTimestamp?: string;
  symbol: string;
  direction: TradeDirection;
  leverage: number;
  entry: number;
  exit?: number;
  tp?: number;
  sl: number;
  tps: TakeProfit[];
  pnlPercentage: number;
  pnlAmount: number;
  review: string;
  snapshot?: string; // 舊版本相容
  snapshots: string[]; // 新版本支援多圖
  strategy: string;
  accountId: string;
  positionSize: number;
  positionUnit: 'Margin' | 'Tokens';
  status: TradeStatus;
  aiFeedback?: string;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface EquityPoint {
  date: string;
  equity: number;
}
