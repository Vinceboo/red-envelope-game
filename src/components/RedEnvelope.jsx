import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const RedEnvelope = ({ id, status, onSelect, className, index, layoutId, isInteractive, onOpen }) => {
    const isSelected = status === 'selected';
    const isHidden = status === 'hidden';
    const isReady = status === 'ready';

    // Calculate random delay for idle animation to make them look more natural
    const randomDelay = index * 0.2;

    // Spring config for iOS-like feel (bouncy but controlled)
    const springConfig = { type: "spring", stiffness: 300, damping: 30, mass: 1 };

    return (
        <motion.div
            layoutId={layoutId}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
                opacity: isHidden ? 0 : 1,
                scale: isHidden ? 0.8 : 1,
                y: isHidden ? 50 : 0,
                pointerEvents: isHidden ? 'none' : 'auto',
                // Restore filter for selected state if needed, or keep clean
                filter: isSelected ? 'brightness(1.1)' : 'brightness(1)',
                zIndex: isReady ? 100 : 1,
            }}
            transition={springConfig}
            onClick={() => status === 'idle' && onSelect(id)}
            className={cn(
                'relative cursor-pointer select-none touch-none',
                'w-32 h-44 md:w-36 md:h-48', // Dimensions optimized for 2 cols scrollable
                'flex items-center justify-center',
                'group',
                'will-change-transform backface-hidden', // Optimization hints
                className
            )}
            whileHover={status === 'idle' ? { scale: 1.05, y: -10 } : {}}
            whileTap={status === 'idle' ? { scale: 0.95 } : {}}
        >
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={status === 'idle' ? {
                    y: [-6, 6, -6], // Pure translation is cheaper than rotation
                } : {}}
                transition={{
                    repeat: Infinity,
                    duration: 3 + Math.random() * 2, // Smooth floating duration
                    ease: "easeInOut",
                    delay: randomDelay,
                }}
            >
                {/* Envelope Body - Glass + Gradient */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-300 group-hover:shadow-3xl border border-white/10 bg-gradient-to-br from-[var(--color-ios-red)] to-[var(--color-ios-red-dark)]">

                    {/* Subtle Noise Texture */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")` }}
                    />

                    {/* Gold Sheen Reflection */}
                    <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />

                    {/* Envelope Flap (Curved using SVG for precision) */}
                    <svg viewBox="0 0 100 60" className="absolute top-0 left-0 w-full h-[60%] pointer-events-none drop-shadow-md z-10">
                        <path d="M0,0 L100,0 L50,50 L0,0 Z" fill="#C40B0B" fillOpacity="0.8" />
                        <path d="M0,0 L50,50 L100,0" fill="none" stroke="rgba(255,214,10,0.3)" strokeWidth="0.5" />
                    </svg>

                    {/* Center Seal/Button - Interactive "Open" */}
                    <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20">
                        <motion.button
                            className={cn(
                                "w-12 h-12 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border border-white/40 ring-4 ring-[#C40B0B]/50",
                                isInteractive ? "cursor-pointer pointer-events-auto active:scale-95" : "pointer-events-none"
                            )}
                            animate={isInteractive ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px #FFD60A", "0 0 20px #FFD60A", "0 0 0px #FFD60A"] } : {}}
                            transition={isInteractive ? { repeat: Infinity, duration: 1.5 } : {}}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isInteractive && onOpen) onOpen();
                            }}
                        >
                            <span className="text-[#8B0000] text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                {isInteractive ? '開' : '福'}
                            </span>
                        </motion.button>
                        {isInteractive && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 30 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap text-white font-bold text-sm tracking-widest drop-shadow-md mt-2"
                            >
                                点击开启
                            </motion.div>
                        )}
                    </div>

                    {/* Decorative Bottom Pattern */}
                    <div className="absolute bottom-0 left-0 w-full h-1/3 overflow-hidden opacity-30">
                        <div className="absolute bottom-[-20%] left-[-20%] right-[-20%] h-[150%] rounded-[50%] border-t border-[var(--color-ios-gold)]" />
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};
