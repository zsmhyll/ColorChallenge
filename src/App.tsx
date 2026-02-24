/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, RefreshCw, Play, Info, AlertCircle, ChevronRight, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gridSize, setGridSize] = useState(2);
  const [colors, setColors] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(-1);
  const [lastDiff, setLastDiff] = useState(0);
  
  // Accuracy tracking
  const [totalClicks, setTotalClicks] = useState(0);
  const [correctClicks, setCorrectClicks] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateColors = useCallback((currentLevel: number) => {
    let size = 2;
    if (currentLevel > 2) size = 3;
    if (currentLevel > 5) size = 4;
    if (currentLevel > 10) size = 5;
    if (currentLevel > 20) size = 6;
    if (currentLevel > 40) size = 8;
    
    setGridSize(size);

    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 40) + 40;
    const l = Math.floor(Math.random() * 40) + 30;

    const diff = Math.max(1, 15 - Math.floor(currentLevel / 3));
    setLastDiff(diff);

    const isLightnessDiff = Math.random() > 0.5;
    const targetL = isLightnessDiff ? (l + diff > 90 ? l - diff : l + diff) : l;
    const targetS = !isLightnessDiff ? (s + diff > 90 ? s - diff : s + diff) : s;

    const baseColorStr = `hsl(${h}, ${s}%, ${l}%)`;
    const targetColorStr = `hsl(${h}, ${targetS}%, ${targetL}%)`;

    const totalBlocks = size * size;
    const newColors = Array(totalBlocks).fill(baseColorStr);
    const targetIdx = Math.floor(Math.random() * totalBlocks);
    newColors[targetIdx] = targetColorStr;

    setColors(newColors);
    setTargetIndex(targetIdx);
  }, []);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setLevel(1);
    setTimeLeft(60);
    setTotalClicks(0);
    setCorrectClicks(0);
    generateColors(1);
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    setTotalClicks(prev => prev + 1);

    if (index === targetIndex) {
      setCorrectClicks(prev => prev + 1);
      const nextLevel = level + 1;
      setScore(s => s + 10);
      setLevel(nextLevel);
      setTimeLeft(t => Math.min(60, t + 2));
      generateColors(nextLevel);
      
      if (nextLevel % 10 === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } else {
      setTimeLeft(t => Math.max(0, t - 5));
    }
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setGameState('GAMEOVER');
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const accuracy = totalClicks > 0 ? Math.round((correctClicks / totalClicks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#2D2D2A] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-[#FDFCF9]/80 backdrop-blur-xl border-b border-[#2D2D2A]/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5A5A40] to-[#8A8A60] shadow-lg shadow-[#5A5A40]/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] uppercase opacity-40 leading-none mb-1">Chroma Vision</h1>
            <p className="text-sm font-serif italic font-semibold">色彩敏感度挑战</p>
          </div>
        </div>
        
        {gameState === 'PLAYING' && (
          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-2">
              <Target className="w-4 h-4 opacity-40" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-40">正确率</span>
                <span className="font-mono text-sm font-bold">{accuracy}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 opacity-40" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-40">剩余时间</span>
                <span className={`font-mono text-sm font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 opacity-40" />
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-40">当前得分</span>
                <span className="font-mono text-sm font-bold">{score}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-32 pb-12 px-6 max-w-2xl mx-auto flex flex-col items-center min-h-screen">
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-12"
            >
              <div className="space-y-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-1.5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-bold uppercase tracking-[0.2em] mb-4"
                >
                  Artistic Vision Assessment
                </motion.div>
                <h2 className="text-6xl md:text-8xl font-serif italic tracking-tight leading-tight">
                  色彩<br />敏感度挑战
                </h2>
                <p className="text-[#2D2D2A]/60 max-w-md mx-auto leading-relaxed text-lg">
                  专为艺术从业者设计的视觉精度测试。在细微的色差中捕捉那唯一的不同。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                <div className="p-6 rounded-[2rem] bg-white border border-[#2D2D2A]/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-[#5A5A40]/5 flex items-center justify-center mb-4">
                    <Info className="w-5 h-5 text-[#5A5A40]" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2">核心规则</h3>
                  <p className="text-sm text-[#2D2D2A]/60 leading-relaxed">点击网格中颜色略有不同的方块。随着关卡提升，色差将变得极其微弱。</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white border border-[#2D2D2A]/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2">时间惩罚</h3>
                  <p className="text-sm text-[#2D2D2A]/60 leading-relaxed">每一次错误的点击都会扣除 5 秒宝贵的时间。保持冷静，精准出击。</p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="group relative inline-flex items-center gap-4 px-16 py-5 bg-[#2D2D2A] text-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#2D2D2A]/20"
              >
                <div className="absolute inset-0 bg-[#5A5A40] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative font-bold tracking-[0.2em] uppercase text-sm">开启视觉之旅</span>
                <Play className="relative w-4 h-4 fill-current" />
              </button>
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full flex flex-col items-center gap-10"
            >
              <div className="flex justify-between w-full items-end border-b border-[#2D2D2A]/5 pb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">当前关卡</p>
                  <p className="text-4xl font-serif italic text-[#5A5A40]">{level}</p>
                </div>
                <div className="flex gap-8">
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">实时正确率</p>
                    <p className="text-xl font-mono font-bold">{accuracy}%</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">当前色差</p>
                    <p className="text-xl font-mono font-bold">{lastDiff}%</p>
                  </div>
                </div>
              </div>

              <div 
                className="grid gap-3 w-full aspect-square max-w-[540px] p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-[#2D2D2A]/5 border border-[#2D2D2A]/5"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`
                }}
              >
                {colors.map((color, idx) => (
                  <motion.button
                    key={`${level}-${idx}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: idx * 0.005 
                    }}
                    onClick={() => handleBlockClick(idx)}
                    className="w-full h-full rounded-2xl shadow-inner transition-all hover:brightness-110 active:scale-90 cursor-pointer"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex gap-3 items-center text-[10px] font-bold uppercase tracking-[0.3em] opacity-20">
                <span>捕捉那抹独特的色彩</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-12 w-full"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#5A5A40]/10 flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-[#5A5A40]" />
                </div>
                <h2 className="text-5xl font-serif italic">挑战达成</h2>
                <p className="text-[#2D2D2A]/60 text-lg">你的视觉敏锐度已记录在案。</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
                <div className="p-6 rounded-3xl bg-white border border-[#2D2D2A]/5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mb-2">最终得分</p>
                  <p className="text-4xl font-serif italic">{score}</p>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-[#2D2D2A]/5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mb-2">通过关卡</p>
                  <p className="text-4xl font-serif italic">{level - 1}</p>
                </div>
                <div className="p-6 rounded-3xl bg-white border border-[#2D2D2A]/5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mb-2">平均正确率</p>
                  <p className="text-4xl font-serif italic">{accuracy}%</p>
                </div>
              </div>

              <div className="p-10 rounded-[3rem] bg-white border border-[#2D2D2A]/5 shadow-xl space-y-8 max-w-md mx-auto">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-[#5A5A40]">视觉潜能报告</h3>
                <div className="space-y-5 text-left">
                  <div className="flex justify-between items-center border-b border-[#2D2D2A]/5 pb-3">
                    <span className="text-sm opacity-60 italic font-serif">极限辨识度</span>
                    <span className="text-lg font-mono font-bold">{lastDiff}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#2D2D2A]/5 pb-3">
                    <span className="text-sm opacity-60 italic font-serif">视觉稳定性</span>
                    <span className="text-lg font-mono font-bold">{accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm opacity-60 italic font-serif">综合视觉等级</span>
                    <span className="text-xl font-bold text-[#5A5A40] tracking-tight">
                      {level > 45 ? '神启之眼' : level > 35 ? '色域宗师' : level > 25 ? '艺术巨匠' : level > 15 ? '专业画师' : level > 5 ? '美术学徒' : '视觉初学者'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="group relative inline-flex items-center gap-4 px-16 py-5 bg-[#2D2D2A] text-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#2D2D2A]/20"
              >
                <div className="absolute inset-0 bg-[#5A5A40] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative font-bold tracking-[0.2em] uppercase text-sm">再次挑战</span>
                <RefreshCw className="relative w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#5A5A40]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#8A8A60]/5 blur-[120px]" />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-10 pointer-events-none opacity-10 hidden lg:block">
        <div className="flex justify-between items-end max-w-[1800px] mx-auto">
          <div className="font-mono text-[9px] uppercase tracking-[0.8em] [writing-mode:vertical-rl] rotate-180">
            CHROMA VISION PRECISION ENGINE // SERIAL: CV-2026-ART
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.8em] [writing-mode:vertical-rl]">
            ARTISTIC SENSITIVITY ASSESSMENT // EST. 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
