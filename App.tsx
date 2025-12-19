
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import LogTrade from './components/LogTrade';
import TradeHistory from './components/TradeHistory';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import PullToRefresh from './components/PullToRefresh';
import AuthGate from './components/AuthGate';
import { Trade, Account, Category, Language } from './types';
import { INITIAL_SYMBOLS, INITIAL_STRATEGIES, INITIAL_ACCOUNTS } from './constants';

const TRADES_KEY = 'crypto_journal_trades_v4';
const ACCOUNTS_KEY = 'crypto_journal_accounts_v4';
const SYMBOLS_KEY = 'crypto_journal_symbols_v4';
const STRATEGIES_KEY = 'crypto_journal_strategies_v4';
const LANG_KEY = 'crypto_journal_lang';
const AUTH_SESSION_KEY = 'mh_auth_session'; 
const SECURITY_PIN_KEY = 'mh_security_pin';

const App: React.FC = () => {
  // 檢查是否已設定 PIN，若無 PIN 則預設授權，若有 PIN 則檢查 Session
  const [isAuthorized, setIsAuthorized] = useState(() => {
    const hasPinSet = localStorage.getItem(SECURITY_PIN_KEY);
    if (!hasPinSet) return true; // 初次使用或未設定密碼，直接進入
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true'; // 已設定密碼，則需檢查本節權限
  });
  
  const [activeTab, setActiveTab] = useState('metrics'); 
  const [lang, setLang] = useState<Language>('zh');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [symbols, setSymbols] = useState<Category[]>([]);
  const [strategies, setStrategies] = useState<Category[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // 處理授權成功
  const handleAuthorized = () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    setIsAuthorized(true);
  };

  // 初始載入資料
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

  // 資料持久化存儲
  useEffect(() => { localStorage.setItem(TRADES_KEY, JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols)); }, [symbols]);
  useEffect(() => { localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies)); }, [strategies]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  const handleRefresh = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  };

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

  const handleImportTrades = (newTrades: Trade[]) => {
    const existingKeys = new Set(trades.map(t => `${t.timestamp}-${t.symbol}`));
    const uniqueNewTrades = newTrades.filter(t => !existingKeys.has(`${t.timestamp}-${t.symbol}`));
    if (uniqueNewTrades.length === 0) {
      alert('未發現新交易紀錄或所有交易已存在。');
      return;
    }
    const totalPnlToApply = uniqueNewTrades.reduce((sum, t) => t.status === 'Closed' ? sum + t.pnlAmount : sum, 0);
    setAccounts(prevAccs => prevAccs.map(acc => 
      acc.id === (uniqueNewTrades[0].accountId || 'default') ? { ...acc, currentBalance: acc.currentBalance + totalPnlToApply } : acc
    ));
    setTrades(prev => [...uniqueNewTrades, ...prev]);
    alert(`成功導入 ${uniqueNewTrades.length} 筆交易紀錄！`);
    setActiveTab('history');
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('確定要永久刪除此筆交易紀錄嗎？')) {
      const tradeToDelete = trades.find(t => t.id === id);
      if (tradeToDelete && tradeToDelete.status === 'Closed') {
        setAccounts(prev => prev.map(acc => 
          acc.id === tradeToDelete.accountId ? { ...acc, currentBalance: acc.currentBalance - tradeToDelete.pnlAmount } : acc
        ));
      }
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateAccount = (acc: Account) => {
    setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
  };

  if (!isAuthorized) {
    return <AuthGate onAuthorized={handleAuthorized} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={lang}>
      <PullToRefresh onRefresh={handleRefresh} lang={lang}>
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
            onImportTrades={handleImportTrades}
            onAddAccount={acc => setAccounts(prev => [...prev, { id: Math.random().toString(36).substr(2, 5), name: acc.name || '', initialBalance: acc.initialBalance || 0, currentBalance: acc.initialBalance || 0 }])}
            onDeleteAccount={id => { if(accounts.length > 1) setAccounts(prev => prev.filter(a => a.id !== id)); }}
            onAddSymbol={name => setSymbols(prev => [...prev, { id: Date.now().toString(), name: name.toUpperCase() }])}
            onDeleteSymbol={id => setSymbols(prev => prev.filter(s => s.id !== id))}
            onAddStrategy={name => setStrategies(prev => [...prev, { id: Date.now().toString(), name }])}
            onDeleteStrategy={id => setStrategies(prev => prev.filter(s => s.id !== id))}
          />
        )}
      </PullToRefresh>
    </Layout>
  );
};

export default App;
