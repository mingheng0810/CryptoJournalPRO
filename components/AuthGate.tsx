
import React, { useState, useEffect } from 'react';

interface AuthGateProps {
  onAuthorized: () => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuthorized }) => {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('mh_security_pin');
    if (savedPin) {
      setStoredPin(savedPin);
    } else {
      setIsSettingUp(true);
    }
  }, []);

  const handleNumberClick = (num: string) => {
    setError(false);
    if (isSettingUp) {
      if (pin.length < 6) setPin(prev => prev + num);
      else if (confirmPin.length < 6) setConfirmPin(prev => prev + num);
    } else {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 6) {
          if (newPin === storedPin) {
            onAuthorized();
          } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (confirmPin.length > 0) setConfirmPin(prev => prev.slice(0, -1));
    else setPin(prev => prev.slice(0, -1));
  };

  const handleSetupSubmit = () => {
    if (pin === confirmPin && pin.length === 6) {
      localStorage.setItem('mh_security_pin', pin);
      onAuthorized();
    } else {
      setError(true);
      setPin('');
      setConfirmPin('');
    }
  };

  const renderDots = (val: string) => (
    <div className="flex gap-4">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
            i < val.length 
              ? 'bg-[#00FFFF] border-[#00FFFF] shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
              : 'border-zinc-800'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="mb-12 text-center space-y-4">
        <div className="w-20 h-20 bg-black border border-zinc-800 rounded-2xl mx-auto flex items-center justify-center shadow-2xl overflow-hidden">
           <img src="/logo.JPG" alt="MH" className="w-full h-full object-cover opacity-80" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase">
            {isSettingUp ? 'Set Security Protocol' : 'Identity Verification'}
          </h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">
            {isSettingUp 
              ? (pin.length < 6 ? 'Create 6-digit PIN' : 'Confirm your PIN')
              : 'Access Protected Data'}
          </p>
        </div>
      </div>

      <div className={`mb-16 transform transition-transform ${error ? 'animate-shake' : ''}`}>
        {isSettingUp ? (
          <div className="space-y-8 flex flex-col items-center">
            {pin.length < 6 ? renderDots(pin) : renderDots(confirmPin)}
            {confirmPin.length === 6 && (
              <button 
                onClick={handleSetupSubmit}
                className="px-8 py-3 bg-[#00FFFF] text-black font-black text-xs rounded-full shadow-[0_0_20px_rgba(0,255,255,0.3)] animate-bounce"
              >
                INITIALIZE SYSTEM
              </button>
            )}
          </div>
        ) : (
          renderDots(pin)
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-[280px] w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((num, i) => (
          num === '' ? <div key={i} /> : (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white bg-zinc-950 border border-zinc-900/50 hover:bg-zinc-900 active:scale-90 active:bg-[#00FFFF] active:text-black transition-all"
            >
              {num}
            </button>
          )
        ))}
        <button
          onClick={handleBackspace}
          className="w-16 h-16 flex items-center justify-center text-zinc-500 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default AuthGate;
