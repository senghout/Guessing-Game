import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Play, CheckCircle2, XCircle, RotateCcw, Facebook, Youtube } from 'lucide-react';

// ==========================================
// GOOGLE SCRIPT URL FOR TRACKING
// ==========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqPsC7KR9nP4oICeW3NRoMvX0hLOr8ScKQ4G6gh_0GdFrucc9DevPhd8wPRVawPHHI/exec";

export default function App() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'result'
  const [step, setStep] = useState(0);
  const [guessedNumber, setGuessedNumber] = useState(0);
  const [bgColor, setBgColor] = useState('bg-slate-950');
  const [isRevealed, setIsRevealed] = useState(false);

  const GAME_MODES = [
    { label: '1 to 50', maxNum: 50, maxBits: 6 },
    { label: '1 to 100', maxNum: 100, maxBits: 7 },
    { label: '1 to 511', maxNum: 511, maxBits: 9 },
  ];

  const [selectedMode, setSelectedMode] = useState(GAME_MODES[0]);
  
  const maxBits = selectedMode.maxBits;
  const maxNum = selectedMode.maxNum;

  // --- GOOGLE SHEETS TRACKING FUNCTION ---
  const trackEvent = (action, number = "") => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") return; // Don't run if URL isn't set
    
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // This is required to skip browser security blocks when sending to Google
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ action: action, number: number })
    }).catch(err => console.log("Tracking error:", err));
  };

  // Track when a visitor first loads the page
  useEffect(() => {
    trackEvent("Visitor Landed");
  }, []);

  // Pre-generate the cards (arrays of numbers)
  const cards = useMemo(() => {
    const generated = [];
    for (let i = 0; i < maxBits; i++) {
      const card = [];
      for (let n = 1; n <= maxNum; n++) {
        if ((n & (1 << i)) !== 0) {
          card.push(n);
        }
      }
      generated.push(card);
    }
    return generated;
  }, [maxBits, maxNum]);

  const startGame = () => {
    setStep(0);
    setGuessedNumber(0);
    setGameState('playing');
    setBgColor('bg-slate-950');
    setIsRevealed(false);
    
    // Track that they started a game
    trackEvent(`Started Game (${selectedMode.label})`);
  };

  const handleAnswer = (isYes) => {
    setBgColor(isYes ? 'bg-emerald-950' : 'bg-rose-950');
    setTimeout(() => setBgColor('bg-slate-950'), 400);

    if (isYes) {
      setGuessedNumber((prev) => prev + (1 << step));
    }

    if (step < maxBits - 1) {
      setStep((prev) => prev + 1);
    } else {
      setGameState('result');
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    // Track the final result
    trackEvent("Game Completed - Guessed Number:", guessedNumber);
  };

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-500 text-slate-100 font-sans flex flex-col items-center justify-center p-4`}>
      
      {/* Background glowing effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="max-w-4xl w-full relative z-10">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center gap-3">
            <Sparkles className="text-indigo-400 w-8 h-8" />
            Senghout Guessing Game
            <Sparkles className="text-purple-400 w-8 h-8" />
          </h1>
        </header>

        {/* START SCREEN */}
        {gameState === 'start' && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl max-w-2xl mx-auto transform transition-all">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">I can read your mind.</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Think of any whole number between <strong className="text-indigo-400">1</strong> and <strong className="text-indigo-400">{maxNum}</strong>. <br/>
              Keep it a secret! I will ask you {maxBits} simple questions to find out exactly what number you are thinking of.
            </p>

            {/* Mode Selection */}
            <div className="mb-10">
              <p className="text-sm text-slate-500 mb-4 uppercase tracking-wider font-semibold">Select Number Range</p>
              <div className="flex flex-wrap justify-center gap-3">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.maxNum}
                    onClick={() => setSelectedMode(mode)}
                    className={`px-6 py-2 rounded-full border text-sm font-medium transition-all duration-200 ${
                      selectedMode.maxNum === mode.maxNum
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg py-4 px-10 rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              Start the Game
            </button>
          </div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'playing' && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <span className="text-indigo-400 font-semibold tracking-wider text-sm uppercase">
                Question {step + 1} of {maxBits}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: maxBits }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-6 bg-indigo-500' : idx < step ? 'w-2 bg-purple-500/50' : 'w-2 bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Is your secret number in this table?
            </h2>

            {/* Number Grid Container */}
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-4 mb-8 h-[40vh] md:h-[50vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
                {cards[step].map((num) => (
                  <div 
                    key={num} 
                    className="flex items-center justify-center bg-slate-800/80 hover:bg-indigo-900/50 border border-slate-700/50 rounded-lg py-2 text-sm md:text-base font-medium text-slate-300 transition-colors"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                onClick={() => handleAnswer(true)}
                className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold text-lg py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                Yes, it is
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold text-lg py-4 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                <XCircle className="w-6 h-6" />
                No, it isn't
              </button>
            </div>
          </div>
        )}

        {/* RESULT SCREEN */}
        {gameState === 'result' && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 md:p-16 text-center shadow-2xl max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            <p className="text-indigo-400 font-semibold tracking-widest uppercase mb-4 text-sm">
              Mind Reading Complete
            </p>
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              {!isRevealed ? "I know the number you are thinking of..." : "The number you are thinking of is..."}
            </h2>
            
            {!isRevealed ? (
              <div className="py-8">
                <button
                  onClick={handleReveal}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xl py-5 px-10 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse"
                >
                  <Sparkles className="w-6 h-6" />
                  Click to Reveal Answer!
                </button>
              </div>
            ) : (
              <div className="animate-in zoom-in duration-500">
                <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-10 drop-shadow-2xl">
                  {guessedNumber === 0 ? "Wait..." : guessedNumber}
                </div>

                {guessedNumber === 0 && (
                  <p className="text-rose-400 mb-8">
                    You didn't click "Yes" for any table! Were you thinking of 0? (The game is for 1 to {maxNum}!)
                  </p>
                )}

                <button
                  onClick={startGame}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-8 rounded-full border border-slate-700 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social Contact Links (Shows on all pages) */}
        <footer className="mt-16 flex flex-col items-center justify-center space-y-5 mb-8">
          <p className="text-slate-500 text-xs md:text-sm font-medium tracking-widest uppercase">
            Connect with Kheng Senghout
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <a href="https://www.tiktok.com/@khengsenghout" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold group">
              <svg className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </a>
            <a href="https://web.facebook.com/khengsenghout" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-[#1877F2] transition-colors text-sm font-semibold">
              <Facebook className="w-5 h-5" /> Facebook
            </a>
            <a href="https://www.youtube.com/@khengsenghout" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-[#FF0000] transition-colors text-sm font-semibold">
              <Youtube className="w-5 h-5" /> YouTube
            </a>
          </div>

          {/* Visitor Counter Badge */}
          <div className="pt-6 opacity-70 hover:opacity-100 transition-opacity duration-300">
            <img 
              src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=khengsenghout-guessing-game&count_bg=%234F46E5&title_bg=%230F172A&icon=&icon_color=%23E7E7E7&title=Visitors&edge_flat=true" 
              alt="Visitor Count" 
              className="h-6"
            />
          </div>
        </footer>

      </div>

      {/* Custom Scrollbar Styles embedded for ease of single-file use */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
      `}} />
    </div>
  );
}