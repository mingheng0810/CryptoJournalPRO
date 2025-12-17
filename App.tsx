
import React, { useState, useEffect } from 'react';
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
    const sTrades = localStorage.getItem(TRADES_KEY);
    const sAccs = localStorage.getItem(ACCOUNTS_KEY);
    const sSyms = localStorage.getItem(SYMBOLS_KEY);
    const sStrat = localStorage.getItem(STRATEGIES_KEY);
    const sLang = localStorage.getItem(LANG_KEY);

    if (sLang) setLang(sLang as Language);
    if (sTrades) setTrades(JSON.parse(sTrades));
    if (sAccs) setAccounts(JSON.parse(sAccs)); else setAccounts(INITIAL_ACCOUNTS);
    if (sSyms) setSymbols(JSON.parse(sSyms)); else setSymbols(INITIAL_SYMBOLS.map((s, i) => ({ id: i.toString(), name: s })));
    if (sStrat) setStrategies(JSON.parse(sStrat)); else setStrategies(INITIAL_STRATEGIES.map((s, i) => ({ id: i.toString(), name: s })));
  }, []);

  useEffect(() => { localStorage.setItem(TRADES_KEY, JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem(SYMBOLS_KEY, JSON.stringify(symbols)); }, [symbols]);
  useEffect(() => { localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies)); }, [strategies]);
  useEffect(() => { localStorage.setItem(LANG_KEY, lang); }, [lang]);

  const handleAddOrUpdateTrade = (trade: Trade) => {
    const exists = trades.find(t => t.id === trade.id);
    let updatedTrades;
    
    if (exists) {
      updatedTrades = trades.map(t => t.id === trade.id ? trade : t);
      // If it was just closed, update account balance
      if (exists.status === 'Active' && trade.status === 'Closed') {
        setAccounts(accounts.map(acc => acc.id === trade.accountId ? { ...acc, currentBalance: acc.currentBalance + trade.pnlAmount } : acc));
      }
    } else {
      updatedTrades = [trade, ...trades];
    }
    
    setTrades(updatedTrades);
    setEditingTrade(null);
    setActiveTab('history');
  };

  const handleUpdateAccount = (acc: Account) => {
    setAccounts(accounts.map(a => a.id === acc.id ? acc : a));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'log':
        return <LogTrade onAddTrade={handleAddOrUpdateTrade} accounts={accounts} symbols={symbols} strategies={strategies} lang={lang} editingTrade={editingTrade} />;
      case 'metrics':
        return <Statistics trades={trades} lang={lang} />;
      case 'settings':
        return (
          <Settings 
            accounts={accounts} symbols={symbols} strategies={strategies}
            lang={lang} setLang={setLang}
            onUpdateAccount={handleUpdateAccount}
            onAddAccount={acc => setAccounts([...accounts, { id: Math.random().toString(36).substr(2, 5), name: acc.name || '', initialBalance: acc.initialBalance || 0, currentBalance: acc.initialBalance || 0 }])}
            onDeleteAccount={id => { if(accounts.length > 1) setAccounts(accounts.filter(a => a.id !== id)); }}
            onAddSymbol={name => setSymbols([...symbols, { id: Date.now().toString(), name }])}
            onAddStrategy={name => setStrategies([...strategies, { id: Date.now().toString(), name }])}
          />
        );
      case 'history':
      default:
        return <TradeHistory 
          trades={trades} 
          onUpdateTrade={u => setTrades(trades.map(t => t.id === u.id ? u : t))} 
          onEditTrade={t => { setEditingTrade(t); setActiveTab('log'); }}
        />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={lang}>
      {renderContent()}
    </Layout>
  );
};

export default App;
