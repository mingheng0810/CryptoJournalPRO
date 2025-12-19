
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import LogTrade from './components/LogTrade';
import TradeHistory from './components/TradeHistory';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import { Trade, Account, Category, Language } from './types';
import { INITIAL_SYMBOLS, INITIAL_STRATEGIES, INITIAL_ACCOUNTS } from './constants';

const TRADES_KEY = 'crypto_journal_trades_v4';
const ACCOUNTS_KEY = 'crypto_journal_accounts_v4';
const SYMBOLS_KEY = 'crypto_journal_symbols_v4';
const STRATEGIES_KEY = 'crypto_journal_strategies_v4';
const LANG_KEY = 'crypto_journal_lang';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('metrics'); 
  const [lang, setLang] = useState<Language>('zh');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [symbols, setSymbols] = useState<Category[]>([]);
  const [strategies, setStrategies] = useState<Category[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    try {
      const sTrades = localStorage.getItem(TRADES_KEY);
      const sAccs = localStorage.getItem(ACCOUNTS_KEY);
      const sSyms = localStorage.getItem(SYMBOLS_KEY);
      const sStrat = localStorage.getItem(STRATEGIES_KEY);
      const sLang = localStorage.getItem(LANG_KEY);

      if (sLang) setLang(sLang as Language);
      if (sTrades) setTrades(JSON.parse(sTrades));
      
      setAccounts(sAccs ? JSON.parse(sAccs) : INITIAL_ACCOUNTS);
      setSymbols(sSyms ? JSON.parse(sSyms) : INITIAL_SYMBOLS.map((s, i) => ({ id: i.toString(), name: s })));
      setStrategies(sStrat ? JSON.parse(sStrat) : INITIAL_STRATEGIES.map((s, i) => ({ id: i.toString(), name: s })));
    } catch (e) {
      console.error("Failed to load data:", e);
      setAccounts(INITIAL_ACCOUNTS);
    }
  }, []);

  useEffect(() => { localStorage.setItem(TRADES_KEY, JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols)); }, [symbols]);
  useEffect(() => { localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies)); }, [strategies]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  const handleUpdateTrade = useCallback((updatedTrade: Trade) => {
    const originalTrade = trades.find(t => t.id === updatedTrade.id);
    if (!originalTrade) return;

    if (originalTrade.status === 'Active' && updatedTrade.status === 'Closed') {
      setAccounts(prevAccs => prevAccs.map(acc => 
        acc.id === updatedTrade.accountId 
          ? { ...acc, currentBalance: acc.currentBalance + updatedTrade.pnlAmount } 
          : acc
      ));
    } else if (originalTrade.status === 'Closed' && updatedTrade.status === 'Closed') {
      const pnlDiff = updatedTrade.pnlAmount - originalTrade.pnlAmount;
      if (pnlDiff !== 0) {
        setAccounts(prevAccs => prevAccs.map(acc => 
          acc.id === updatedTrade.accountId 
            ? { ...acc, currentBalance: acc.currentBalance + pnlDiff } 
            : acc
        ));
      }
    }

    setTrades(prevTrades => prevTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  }, [trades]);

  const handleAddOrUpdateTrade = (trade: Trade) => {
    const exists = trades.find(t => t.id === trade.id);
    
    if (exists) {
      handleUpdateTrade(trade);
    } else {
      setTrades(prev => [trade, ...prev]);
      if (trade.status === 'Closed') {
        setAccounts(prevAccs => prevAccs.map(acc => 
          acc.id === trade.accountId 
            ? { ...acc, currentBalance: acc.currentBalance + trade.pnlAmount } 
            : acc
        ));
      }
    }
    
    setEditingTrade(null);
    setActiveTab('history');
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('確定要永久刪除此筆交易紀錄嗎？')) {
      const tradeToDelete = trades.find(t => t.id === id);
      if (tradeToDelete && tradeToDelete.status === 'Closed') {
        setAccounts(prev => prev.map(acc => 
          acc.id === tradeToDelete.accountId 
            ? { ...acc, currentBalance: acc.currentBalance - tradeToDelete.pnlAmount } 
            : acc
        ));
      }
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateAccount = (acc: Account) => {
    setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={lang}>
      {activeTab === 'log' && (
        <LogTrade 
          onAddTrade={handleAddOrUpdateTrade} 
          accounts={accounts} 
          symbols={symbols} 
          strategies={strategies} 
          lang={lang} 
          editingTrade={editingTrade} 
        />
      )}
      {activeTab === 'metrics' && <Statistics trades={trades} accounts={accounts} lang={lang} />}
      {activeTab === 'history' && (
        <TradeHistory 
          trades={trades} 
          onUpdateTrade={handleUpdateTrade} 
          onEditTrade={t => { setEditingTrade(t); setActiveTab('log'); }}
          onDeleteTrade={handleDeleteTrade}
        />
      )}
      {activeTab === 'settings' && (
        <Settings 
          accounts={accounts} symbols={symbols} strategies={strategies}
          lang={lang} setLang={setLang}
          onUpdateAccount={handleUpdateAccount}
          onAddAccount={acc => setAccounts(prev => [...prev, { id: Math.random().toString(36).substr(2, 5), name: acc.name || '', initialBalance: acc.initialBalance || 0, currentBalance: acc.initialBalance || 0 }])}
          onDeleteAccount={id => { if(accounts.length > 1) setAccounts(prev => prev.filter(a => a.id !== id)); }}
          onAddSymbol={name => setSymbols(prev => [...prev, { id: Date.now().toString(), name: name.toUpperCase() }])}
          onDeleteSymbol={id => setSymbols(prev => prev.filter(s => s.id !== id))}
          onAddStrategy={name => setStrategies(prev => [...prev, { id: Date.now().toString(), name }])}
          onDeleteStrategy={id => setStrategies(prev => prev.filter(s => s.id !== id))}
        />
      )}
    </Layout>
  );
};

export default App;
