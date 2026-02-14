/**
 * RedEnvelope 组件 (重构版 - 集成开法交互)
 * PRD: 
 * 1. G1 红包网格展示
 * 2. 集成 OpenMethods 交互逻辑 (Swipe/Shake/Tap3/Duo) 到红包主体上
 * 
 * 变更：
 * - 移除 OpenMethodRouter 外部组件
 * - 内部集成 SwipeStrip, ShakeIcon, TapButton 等 UI
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { centsToYuan } from '../utils/hongbaoAlgo';

const cn = (...inputs) => twMerge(clsx(inputs));

// ===========================================
// 子组件：交互元素
// ===========================================

// 1. 长按 (Press)
const PressInteraction = ({ onOpen, isCharging, setIsCharging }) => {
    return (
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20 flex flex-col items-center">
            <motion.button
                className="w-12 h-12 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border border-white/40 ring-4 ring-[#C40B0B]/50 cursor-pointer active:scale-95"
                animate={{
                    scale: isCharging ? [1, 1.2, 1.15] : [1, 1.1, 1],
                    x: isCharging ? [-2, 2, -2, 2, 0] : 0,
                    boxShadow: isCharging
                        ? ["0 0 20px #FFD60A", "0 0 50px #FFD60A", "0 0 20px #FFD60A"]
                        : ["0 0 0px #FFD60A", "0 0 20px #FFD60A", "0 0 0px #FFD60A"]
                }}
                transition={{ repeat: Infinity, duration: isCharging ? 0.1 : 1.5 }}
                onPointerDown={(e) => { e.stopPropagation(); setIsCharging(true); }}
                onPointerUp={(e) => { e.stopPropagation(); setIsCharging(false); }}
                onPointerLeave={(e) => { e.stopPropagation(); setIsCharging(false); }}
            >
                <span className="text-[#8B0000] text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>開</span>
            </motion.button>
            {isCharging && (
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden mt-2">
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, ease: "linear" }}
                        className="h-full bg-[var(--color-ios-gold)]"
                    />
                </div>
            )}
            {!isCharging && <span className="text-white/60 text-[10px] mt-1">长按</span>}
        </div>
    );
};

// 2. 摇一摇 (Shake)
const ShakeInteraction = ({ onOpen, isInteractive }) => {
    const [shakeCount, setShakeCount] = useState(0);
    const threshold = 6;
    const lastAcc = useRef({ x: 0, y: 0, z: 0 });

    useEffect(() => {
        if (!isInteractive) return;

        const handleMotion = (e) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            const delta = Math.abs(acc.x - lastAcc.current.x) + Math.abs(acc.y - lastAcc.current.y) + Math.abs(acc.z - lastAcc.current.z);
            lastAcc.current = { x: acc.x, y: acc.y, z: acc.z };

            if (delta > 25) {
                setShakeCount(c => {
                    const next = c + 1;
                    if (next >= threshold) onOpen();
                    return next;
                });
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [isInteractive, onOpen]);

    return (
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20 flex flex-col items-center pointer-events-none">
            <motion.div
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="w-12 h-12 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border border-white/40"
            >
                <span className="text-2xl">📱</span>
            </motion.div>
            <span className="text-white/60 text-[10px] mt-1">摇一摇</span>
        </div>
    );
};

// 3. 划封条 (Swipe)
const SwipeInteraction = ({ onOpen }) => {
    const [progress, setProgress] = useState(0);
    const containerRef = useRef(null);

    return (
        <div
            ref={containerRef}
            className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] w-[90%] z-20 h-10 bg-black/20 rounded-full border border-[var(--color-ios-gold)]/30 overflow-hidden touch-none"
            onPointerMove={(e) => {
                if (e.buttons === 1) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    const pct = x / rect.width;
                    setProgress(pct);
                    if (pct > 0.8) onOpen();
                }
            }}
            onPointerUp={() => setProgress(0)}
            onPointerLeave={() => setProgress(0)}
        >
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-[10px] pointer-events-none tracking-widest pl-4">
                滑动拆开 &gt;&gt;
            </div>
            <div
                className="h-full bg-gradient-to-r from-[var(--color-ios-gold)] to-[#FFA000] rounded-full flex items-center justify-center shadow-md border-r-2 border-white/50 relative"
                style={{ width: `${Math.max(20, progress * 100)}%` }}
            >
                <div className="absolute right-2 text-[#8B0000] font-bold text-xs pointer-events-none">封</div>
            </div>
        </div>
    );
};

// 4. 连点三次 (Tap3)
const Tap3Interaction = ({ onOpen }) => {
    const [taps, setTaps] = useState(0);
    const timer = useRef(null);

    const handleTap = (e) => {
        e.stopPropagation();
        const next = taps + 1;
        setTaps(next);
        clearTimeout(timer.current);

        if (next >= 3) {
            onOpen();
            setTaps(0);
        } else {
            timer.current = setTimeout(() => setTaps(0), 1000);
        }
    };

    return (
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20 flex flex-col items-center">
            <motion.button
                onPointerDown={handleTap}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    "w-12 h-12 rounded-full shadow-lg flex items-center justify-center border border-white/40 transition-colors",
                    taps === 0 ? "bg-white/10" : taps === 1 ? "bg-[var(--color-ios-gold)]/50" : "bg-[var(--color-ios-gold)]"
                )}
            >
                <span className="text-white font-bold text-lg">{3 - taps}</span>
            </motion.button>
            <span className="text-white/60 text-[10px] mt-1">连点3次</span>
        </div>
    );
};

// 5. 双人 (Duo) - 指纹
const DuoInteraction = ({ onOpen }) => {
    const [p1, setP1] = useState(false);
    const [p2, setP2] = useState(false);

    useEffect(() => {
        if (p1 && p2) onOpen();
    }, [p1, p2, onOpen]);

    return (
        <div className="absolute top-[30%] left-0 w-full flex justify-center gap-4 z-20 px-2">
            <div className="flex flex-col items-center gap-1">
                <button
                    onPointerDown={(e) => { e.stopPropagation(); setP1(true); }}
                    onPointerUp={(e) => { e.stopPropagation(); setP1(false); }}
                    onPointerLeave={() => setP1(false)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${p1 ? 'bg-green-500 border-green-300' : 'bg-white/10 border-white/30'}`}
                >
                    👆
                </button>
                <span className="text-[10px] text-white/50">我</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <button
                    onPointerDown={(e) => { e.stopPropagation(); setP2(true); }}
                    onPointerUp={(e) => { e.stopPropagation(); setP2(false); }}
                    onPointerLeave={() => setP2(false)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${p2 ? 'bg-green-500 border-green-300' : 'bg-white/10 border-white/30'}`}
                >
                    👆
                </button>
                <span className="text-[10px] text-white/50">伙伴</span>
            </div>
        </div>
    );
};

// ===========================================
// 主组件: RedEnvelope
// ===========================================

export const RedEnvelope = ({ id, status, opened, amountCents, title, onSelect, className, index, layoutId, isInteractive, onOpen, openMethod = 'press' }) => {
    const isSelected = status === 'selected';
    const isHidden = status === 'hidden';
    const isReady = status === 'ready';
    const isOpened = opened;

    const [isCharging, setIsCharging] = useState(false);
    const chargeTimerRef = useRef(null);

    // Press Logic
    useEffect(() => {
        if (isCharging && isInteractive && openMethod === 'press') {
            chargeTimerRef.current = setTimeout(() => {
                setIsCharging(false);
                onOpen?.();
            }, 800);
        }
        return () => clearTimeout(chargeTimerRef.current);
    }, [isCharging, isInteractive, openMethod, onOpen]);

    const renderInteraction = () => {
        if (isOpened) {
            return (
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20 flex flex-col items-center">
                    <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center border border-white/10">
                        <span className="text-white/60 text-xs font-bold">已拆</span>
                    </div>
                    <span className="text-[var(--color-ios-gold)] text-sm font-bold mt-6 drop-shadow-lg whitespace-nowrap">
                        ¥{centsToYuan(amountCents)}
                    </span>
                    {title && (
                        <span className="text-white/50 text-[10px] mt-1 px-2 py-0.5 bg-black/20 rounded-full whitespace-nowrap">
                            {title.text}
                        </span>
                    )}
                </div>
            );
        }

        if (!isInteractive) {
            // Idle state seal
            return (
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 translate-y-[-50%] z-20">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border border-white/40 ring-4 ring-[#C40B0B]/50">
                        <span className="text-[#8B0000] text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>福</span>
                    </div>
                </div>
            );
        }

        // Interactive states
        switch (openMethod) {
            case 'shake': return <ShakeInteraction onOpen={onOpen} isInteractive={isInteractive} />;
            case 'swipe': return <SwipeInteraction onOpen={onOpen} />;
            case 'tap3': return <Tap3Interaction onOpen={onOpen} />;
            case 'duo': return <DuoInteraction onOpen={onOpen} />;
            case 'press':
            default: return <PressInteraction onOpen={onOpen} isCharging={isCharging} setIsCharging={setIsCharging} />;
        }
    };

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
                filter: isSelected ? 'brightness(1.1)' : 'brightness(1)',
                zIndex: isReady ? 100 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
            onClick={() => !isOpened && status === 'idle' && onSelect?.(id)}
            className={cn(
                'relative select-none touch-none',
                isOpened ? 'cursor-default' : 'cursor-pointer',
                'w-32 h-44 md:w-36 md:h-48',
                'flex items-center justify-center',
                'group',
                'will-change-transform backface-hidden',
                className
            )}
            whileHover={!isOpened && status === 'idle' ? { scale: 1.05, y: -10 } : {}}
            whileTap={!isOpened && status === 'idle' ? { scale: 0.95 } : {}}
        >
            <motion.div
                className="w-full h-full relative preserve-3d"
                animate={status === 'idle' && !isOpened ? { y: [-6, 6, -6] } : {}}
                transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, ease: "easeInOut", delay: index * 0.2 }}
            >
                {/* Envelope Body */}
                <div className={cn(
                    "absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-300 border border-white/10",
                    isOpened
                        ? "bg-gradient-to-br from-[#8B4513]/80 to-[#5C3317]/80 opacity-70"
                        : "bg-gradient-to-br from-[var(--color-ios-red)] to-[var(--color-ios-red-dark)] group-hover:shadow-3xl"
                )}>
                    {/* Noise & Patterns */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")` }} />

                    {/* Flap */}
                    <svg viewBox="0 0 100 60" className="absolute top-0 left-0 w-full h-[60%] pointer-events-none drop-shadow-md z-10">
                        <path d="M0,0 L100,0 L50,50 L0,0 Z" fill={isOpened ? "#5C3317" : "#C40B0B"} fillOpacity="0.8" />
                        <path d="M0,0 L50,50 L100,0" fill="none" stroke="rgba(255,214,10,0.3)" strokeWidth="0.5" />
                    </svg>

                    {/* Interaction Area */}
                    {renderInteraction()}

                    {/* Bottom Deco */}
                    <div className="absolute bottom-0 left-0 w-full h-1/3 overflow-hidden opacity-30">
                        <div className="absolute bottom-[-20%] left-[-20%] right-[-20%] h-[150%] rounded-[50%] border-t border-[var(--color-ios-gold)]" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
