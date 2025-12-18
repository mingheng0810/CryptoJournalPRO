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
  const
