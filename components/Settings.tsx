
import React, { useState } from 'react';
import { Account, Category, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface SettingsProps {
  accounts: Account[];
  symbols: Category[];
  strategies: Category[];
  lang: Language;
  setLang: (l: Language) => void;
  onAddAccount: (acc: Partial<Account>) => void;
  onUpdateAccount: (acc: Account) => void;
  onAddSymbol: (name: string) => void;
  onAddStrategy: (name: string) => void;
  onDeleteAccount: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  accounts, symbols, strategies, lang, setLang,
  onAddAccount, onUpdateAccount, onAddSymbol, onAddStrategy, onDeleteAccount 
}) => {
  const t = TRANSLATIONS[lang];
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const handleUpdateBalance = (acc: Account, newBalance: string) => {
    const balance = parseFloat(newBalance);
    if (!isNaN(balance)) {
      // Logic: If user updates initial balance, we recalculate current balance as initial + all realized gains
      // But for simplicity in settings, we let them overwrite initialBalance and the app recalculates current in App.tsx logic
      onUpdateAccount({ ...acc, initialBalance: balance });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      {/* Language Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.language}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-3 flex shadow-2xl">
           <button onClick={() => setLang('zh')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'zh' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>繁體中文</button>
           <button onClick={() => setLang('en')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${lang === 'en' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/20' : 'text-zinc-600'}`}>ENGLISH</button>
        </div>
      </section>

      {/* Accounts Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.account}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-6 space-y-6 shadow-2xl">
          {accounts.map(acc => (
            <div key={acc.id} className="p-6 bg-[#111] rounded-3xl border border-[#222] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter">{acc.name}</span>
                  <span className="text-[10px] text-[#00FFFF] font-black uppercase tracking-widest">Realized Balance: ${acc.currentBalance.toLocaleString()}</span>
                </div>
                {accounts.length > 1 && (
                  <button onClick={() => onDeleteAccount(acc.id)} className="p-2 bg-red-900/10 rounded-xl hover:bg-red-500 hover:text-black transition-all group">
                    <svg className="w-5 h-5 text-red-500 group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.initialBalance}</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    defaultValue={acc.initialBalance}
                    onBlur={(e) => handleUpdateBalance(acc, e.target.value)}
                    className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-[#00FFFF] outline-none focus:border-[#00FFFF] transition-all" 
                  />
                  <div className="bg-zinc-900 px-4 flex items-center rounded-xl text-zinc-500 text-[10px] font-black">USDT</div>
                </div>
              </div>
            </div>
          ))}

          <div className="space-y-4 pt-6 border-t border-[#1A1A1A]">
            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-center">Register New Account</h3>
            <input placeholder="Account Name" value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-[#00FFFF] outline-none transition-all" />
            <div className="flex gap-2">
              <input type="number" placeholder="Initial Balance" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:border-[#00FFFF] outline-none transition-all" />
              <button onClick={() => { if(newAccName && newAccBalance) { onAddAccount({ name: newAccName, initialBalance: parseFloat(newAccBalance) }); setNewAccName(''); setNewAccBalance(''); } }} className="bg-white text-black px-8 rounded-2xl font-black text-[10px] uppercase hover:bg-[#00FFFF] transition-all shadow-xl">ADD</button>
            </div>
          </div>
        </div>
      </section>

      {/* Symbols Management */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 text-center">{t.symbol}</h2>
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2rem] p-8 space-y-6 shadow-2xl">
          <div className="flex flex-wrap gap-2">
            {symbols.map(s => (
              <div key={s.id} className="px-5 py-2.5 bg-[#111] rounded-2xl border border-[#222] text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {s.name}
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-zinc-900">
            <input placeholder="New Symbol (e.g. LINK)" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#00FFFF] transition-all" />
            <button onClick={() => { if(newSymbol) { onAddSymbol(newSymbol); setNewSymbol(''); } }} className="bg-[#00FFFF] text-black w-14 h-14 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-all active:scale-95">+</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
