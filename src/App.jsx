/**
 * App.jsx - 全局容器 (重构版)
 * PRD: A) 数据结构 + G) 全局状态管理
 * 
 * 职责：
 * - 管理全局 settings (DEFAULT_SETTINGS)
 * - 管理视图切换 view: 'setup' | 'game'
 * - 生成红包 (buildEnvelopes)
 * - 传递 props 给 SetupScreen / GameScreen
 */

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MusicPlayer } from './components/MusicPlayer';
import { ClickSparkles } from './components/ClickSparkles';
import { FireworksBackground } from './components/FireworksBackground';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { DEFAULT_SETTINGS, validateSettings, buildEnvelopes } from './utils/hongbaoAlgo';

function App() {
  const [view, setView] = useState('setup'); // 'setup' | 'game'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [envelopes, setEnvelopes] = useState([]);

  // C5: 点击"塞钱进红包"
  const handleStart = () => {
    const result = validateSettings(settings);
    if (!result.valid) {
      alert(result.error);
      return;
    }
    const newEnvelopes = buildEnvelopes(settings);
    setEnvelopes(newEnvelopes);
    setView('game');
  };

  // G4: 返回配置
  const handleBack = () => {
    setView('setup');
  };

  // 返回设置（保留 settings）
  const handleSettings = () => {
    setView('setup');
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start py-12 px-4 relative overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">
      {/* 全局氛围组件 */}
      <MusicPlayer />
      <ClickSparkles />
      <FireworksBackground />

      {/* 视图切换 */}
      <AnimatePresence mode="wait">
        {view === 'setup' ? (
          <SetupScreen
            key="setup"
            config={settings}
            onConfigChange={setSettings}
            onStart={handleStart}
          />
        ) : (
          <GameScreen
            key="game"
            envelopes={envelopes}
            settings={settings}
            onBack={handleBack}
            onSettings={handleSettings}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 text-center text-white/20 text-xs font-medium tracking-widest uppercase">
        Apple Intelligence 设计
      </div>
    </div>
  );
}

export default App;
