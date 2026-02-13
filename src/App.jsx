import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RedEnvelope } from './components/RedEnvelope';
import { ResultModal } from './components/ResultModal';
import { generateEnvelopes, drawPrize } from './utils/gameLogic';

function App() {
  const [gameState, setGameState] = useState('idle'); // idle, selecting, ready, opening, result
  const [envelopes, setEnvelopes] = useState(generateEnvelopes(10));
  const [selectedId, setSelectedId] = useState(null);
  const [prizeAmount, setPrizeAmount] = useState(0);

  const handleSelect = (id) => {
    if (gameState !== 'idle') return;

    setGameState('selecting');
    setSelectedId(id);

    // Update envelope statuses
    setEnvelopes(prev => prev.map(env => ({
      ...env,
      status: env.id === id ? 'selected' : 'hidden'
    })));

    // Short delay for the "fly to center" animation to complete, then showing the interactive "Open" state
    setTimeout(() => {
      setGameState('ready');
    }, 600);
  };

  const handleOpen = () => {
    if (gameState !== 'ready') return;

    setGameState('opening');
    const amount = drawPrize();
    setPrizeAmount(amount);

    // Show result after a brief "opening" animation
    setTimeout(() => {
      setGameState('result');
    }, 800);
  };

  const handleRestart = () => {
    setGameState('idle');
    setEnvelopes(generateEnvelopes(10));
    setSelectedId(null);
    setPrizeAmount(0);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-start py-12 px-4 relative overflow-y-auto overflow-x-hidden -webkit-overflow-scrolling-touch">

      {/* Header - Apple Style */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // iOS ease
        className="mb-8 text-center z-10 relative"
      >
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-[var(--color-ios-gold)]/30 mb-6 shadow-[0_0_15px_rgba(255,214,10,0.2)]">
          <span className="text-lg">🐎</span>
          <span className="text-sm font-bold text-[var(--color-ios-gold)] uppercase tracking-[0.2em]">丙午马年</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl mb-4"
          style={{ fontFamily: 'var(--font-display)' }}>
          新年快乐
        </h1>
        <p className="text-white/60 text-lg font-medium tracking-wide">
          点击红包开启好运
        </p>
      </motion.div>

      {/* Game Area */}
      <div className="w-full max-w-5xl relative z-0 min-h-[600px] flex items-center justify-center perspective-1000">
        <AnimatePresence mode="popLayout">
          {selectedId === null ? (
            <motion.div
              key="grid"
              className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-10 w-full place-items-center px-4 pb-24"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              {envelopes.map((env, index) => (
                <RedEnvelope
                  key={env.id}
                  {...env}
                  index={index}
                  onSelect={handleSelect}
                  layoutId={`envelope-${env.id}`}
                />
              ))}
            </motion.div>
          ) : (
            gameState !== 'result' && (
              <motion.div
                key="selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center w-full h-full absolute inset-0 z-50"
              >
                {/* Render the selected envelope. 
                   If state is 'ready', it becomes interactive. 
                   We use a large generic RedEnvelope here instead of the mapped one for better control if needed, 
                   but re-using the component with 'layoutId' maintains the transition.
                   We pass 'isInteractive' to enable the "Open" button/state.
               */}
                {envelopes.filter(e => e.id === selectedId).map((env) => (
                  <RedEnvelope
                    key={env.id}
                    {...env}
                    status={gameState === 'ready' || gameState === 'opening' ? 'ready' : 'selected'}
                    isInteractive={gameState === 'ready'}
                    onOpen={handleOpen}
                    className="transform scale-150 md:scale-[2] drop-shadow-3xl cursor-default"
                    layoutId={`envelope-${env.id}`}
                  />
                ))}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {gameState === 'result' && (
          <ResultModal amount={prizeAmount} onRestart={handleRestart} />
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 text-center text-white/20 text-xs font-medium tracking-widest uppercase">
        Apple Intelligence 设计
      </div>
    </div>
  );
}

export default App;
