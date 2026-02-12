import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export const ResultModal = ({ amount, onRestart }) => {
    const [showAmount, setShowAmount] = useState(false);

    useEffect(() => {
        // Trigger confetti when component mounts (result shown)
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        // Fire multiple blasts
        fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FFD60A', '#FF3B30'] });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });

        const timer = setTimeout(() => setShowAmount(true), 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity will-change-opacity" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="relative z-10 w-full max-w-sm overflow-hidden"
            >
                <div className="glass-panel rounded-3xl p-8 text-center relative">
                    {/* Spotlght Effect */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Content */}
                    <motion.h2
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl text-[var(--color-ios-gold)] font-semibold mb-8 tracking-wide drop-shadow-sm"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        恭喜发财
                    </motion.h2>

                    {/* Content with 3D Flip Effect */}
                    <div className="h-48 w-full perspective-1000 mb-8 relative flex items-center justify-center">
                        <AnimatePresence mode='wait'>
                            {showAmount ? (
                                <motion.div
                                    key="amount"
                                    initial={{ rotateY: 90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="flex flex-col items-center backface-hidden"
                                >
                                    <span className="text-sm font-medium text-white/80 mb-2 uppercase tracking-widest">获得金额</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl text-white font-medium">¥</span>
                                        <span className="text-7xl text-white font-bold tracking-tighter drop-shadow-lg" style={{ fontFamily: 'var(--font-display)' }}>
                                            {amount}
                                        </span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="closed"
                                    initial={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: -90, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-32 h-44 bg-gradient-to-br from-[var(--color-ios-red)] to-[var(--color-ios-red-dark)] rounded-xl shadow-2xl border border-white/20 backface-hidden absolute"
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-12 h-12 bg-[var(--color-ios-gold)] rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-[var(--color-ios-red)] font-bold">拆</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={onRestart}
                        className="w-full bg-white text-black font-semibold py-4 rounded-full shadow-lg text-lg hover:bg-gray-50 transition-colors ios-btn"
                    >
                        再试一次
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};
