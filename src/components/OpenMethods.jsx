/**
 * 开法皮肤组件 (OpenMethods)
 * PRD: G2 多开法皮肤
 * 
 * 手动测试清单:
 * - press: 长按 800ms → 进度满 → 触发 onSuccess
 * - shake: 摇一摇 6 次 → 进度满 → 触发 onSuccess; 不支持时降级 press
 * - swipe: 向右滑动封条 >= 70% → 触发 onSuccess
 * - tap3: 1.2s 内连点 3 次 → 触发 onSuccess; 超时重置
 * - duo: 两个按钮都点击 → 5s 内完成 → 触发 onSuccess; 超时回退
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// 1. PressOpen - 长按开启 (existing logic, componentized)
// ============================================================
export const PressOpen = ({ onSuccess, onCancel }) => {
    const [progress, setProgress] = useState(0);
    const [isCharging, setIsCharging] = useState(false);
    const timerRef = useRef(null);
    const intervalRef = useRef(null);

    const startCharge = (e) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        setIsCharging(true);
        setProgress(0);

        const startTime = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            setProgress(Math.min(elapsed / 800, 1));
        }, 16);

        timerRef.current = setTimeout(() => {
            clearInterval(intervalRef.current);
            setIsCharging(false);
            setProgress(1);
            onSuccess();
        }, 800);
    };

    const cancelCharge = () => {
        setIsCharging(false);
        setProgress(0);
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
        onCancel?.();
    };

    useEffect(() => () => {
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
    }, []);

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.button
                onPointerDown={startCharge}
                onPointerUp={cancelCharge}
                onPointerLeave={cancelCharge}
                onContextMenu={(e) => e.preventDefault()}
                animate={isCharging ? {
                    scale: [1, 1.15, 1.1],
                    x: [-2, 2, -2, 2, 0],
                    boxShadow: ["0 0 20px #FFD60A", "0 0 50px #FFD60A", "0 0 20px #FFD60A"]
                } : {
                    scale: [1, 1.08, 1],
                    boxShadow: ["0 0 0px #FFD60A", "0 0 15px #FFD60A", "0 0 0px #FFD60A"]
                }}
                transition={isCharging ? { repeat: Infinity, duration: 0.1, ease: "linear" } : { repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-16 h-16 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border-2 border-white/40 ring-4 ring-[#C40B0B]/50 cursor-pointer"
            >
                <span className="text-[#8B0000] text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>開</span>
            </motion.button>
            <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[var(--color-ios-gold)] to-[#FFA000]" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-white/50 text-xs">{isCharging ? '继续按住...' : '长按开启'}</span>
        </div>
    );
};

// ============================================================
// 2. ShakeOpen - 摇一摇开启 (with devicemotion fallback)
// ============================================================
export const ShakeOpen = ({ onSuccess, onCancel }) => {
    const [shakeCount, setShakeCount] = useState(0);
    const [supported, setSupported] = useState(true);
    const [fallback, setFallback] = useState(false);
    const threshold = 6;
    const lastAccRef = useRef({ x: 0, y: 0, z: 0 });
    const shakeCountRef = useRef(0);

    useEffect(() => {
        // 检测是否支持 devicemotion
        if (!window.DeviceMotionEvent) {
            setSupported(false);
            setFallback(true);
            return;
        }

        // iOS 13+ 需要请求权限
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission().then(permission => {
                if (permission !== 'granted') {
                    setSupported(false);
                    setFallback(true);
                }
            }).catch(() => {
                setSupported(false);
                setFallback(true);
            });
        }

        const handleMotion = (e) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            const { x, y, z } = acc;
            const last = lastAccRef.current;
            const delta = Math.abs(x - last.x) + Math.abs(y - last.y) + Math.abs(z - last.z);
            lastAccRef.current = { x, y, z };

            if (delta > 25) {
                shakeCountRef.current += 1;
                setShakeCount(shakeCountRef.current);
                if (shakeCountRef.current >= threshold) {
                    window.removeEventListener('devicemotion', handleMotion);
                    onSuccess();
                }
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [onSuccess]);

    if (fallback) {
        return (
            <div className="flex flex-col items-center gap-2">
                <p className="text-white/40 text-xs mb-1">📱 摇一摇不可用，已降级为长按</p>
                <PressOpen onSuccess={onSuccess} onCancel={onCancel} />
            </div>
        );
    }

    const progress = Math.min(shakeCount / threshold, 1);

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 0.15 }}
                className="w-16 h-16 bg-gradient-to-br from-[var(--color-ios-gold)] to-[#FFA000] rounded-full shadow-lg flex items-center justify-center border-2 border-white/40"
            >
                <span className="text-3xl">📱</span>
            </motion.div>
            <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-white/50 text-xs">
                摇一摇！ ({shakeCount}/{threshold})
            </span>
        </div>
    );
};

// ============================================================
// 3. SwipeOpen - 划封条开启
// ============================================================
export const SwipeOpen = ({ onSuccess, onCancel }) => {
    const [progress, setProgress] = useState(0);
    const containerRef = useRef(null);
    const dragging = useRef(false);
    const startX = useRef(0);

    const handlePointerDown = (e) => {
        dragging.current = true;
        startX.current = e.clientX;
    };

    const handlePointerMove = (e) => {
        if (!dragging.current || !containerRef.current) return;
        const w = containerRef.current.offsetWidth;
        const dx = e.clientX - startX.current;
        const pct = Math.min(Math.max(dx / w, 0), 1);
        setProgress(pct);
    };

    const handlePointerUp = () => {
        dragging.current = false;
        if (progress >= 0.7) {
            setProgress(1);
            onSuccess();
        } else {
            setProgress(0);
        }
    };

    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    });

    return (
        <div className="flex flex-col items-center gap-3">
            <div ref={containerRef} className="relative w-48 h-14 bg-black/20 rounded-2xl border border-white/10 overflow-hidden select-none touch-none">
                {/* Background text */}
                <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm pointer-events-none">
                    → 滑动拆开 →
                </div>
                {/* Seal strip */}
                <motion.div
                    onPointerDown={handlePointerDown}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-ios-red)] to-[var(--color-ios-red-dark)] rounded-2xl border-r-2 border-[var(--color-ios-gold)] flex items-center justify-center cursor-grab active:cursor-grabbing"
                    style={{ width: `${Math.max(20, (1 - progress) * 100)}%`, right: 'auto', left: 0 }}
                    animate={{ x: `${progress * 100}%` }}
                >
                    <span className="text-[var(--color-ios-gold)] font-bold text-sm px-3 whitespace-nowrap">🧧 封</span>
                </motion.div>
            </div>
            <span className="text-white/50 text-xs">向右滑动封条即可拆开</span>
        </div>
    );
};

// ============================================================
// 4. Tap3Open - 连点三次开启
// ============================================================
export const Tap3Open = ({ onSuccess, onCancel }) => {
    const [taps, setTaps] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle | tapping | success | timeout
    const timerRef = useRef(null);

    const handleTap = () => {
        if (phase === 'success') return;

        const newTaps = taps + 1;
        setTaps(newTaps);

        if (newTaps === 1) {
            setPhase('tapping');
            // 1.2s 超时
            timerRef.current = setTimeout(() => {
                setPhase('timeout');
                setTaps(0);
                setTimeout(() => setPhase('idle'), 800);
            }, 1200);
        }

        if (newTaps >= 3) {
            clearTimeout(timerRef.current);
            setPhase('success');
            onSuccess();
        }
    };

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const colors = ['bg-white/10', 'bg-[var(--color-ios-gold)]/30', 'bg-[var(--color-ios-gold)]/60', 'bg-[var(--color-ios-gold)]'];

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.button
                onClick={handleTap}
                whileTap={{ scale: 0.9 }}
                className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center border-2 border-white/40 transition-colors ${colors[taps] || colors[3]}`}
            >
                <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {phase === 'timeout' ? '⏰' : taps < 3 ? `${3 - taps}` : '🎉'}
                </span>
            </motion.button>
            <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < taps ? 'bg-[var(--color-ios-gold)] scale-110' : 'bg-white/20'}`} />
                ))}
            </div>
            <span className="text-white/50 text-xs">
                {phase === 'timeout' ? '超时了！重新来' : phase === 'success' ? '成功！' : '1.2秒内连点 3 次'}
            </span>
        </div>
    );
};

// ============================================================
// 5. DuoOpen - 双人合力开 (本地模拟)
// ============================================================
export const DuoOpen = ({ onSuccess, onCancel }) => {
    const [myReady, setMyReady] = useState(false);
    const [peerReady, setPeerReady] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);
    const [started, setStarted] = useState(false);
    const timerRef = useRef(null);
    const countdownRef = useRef(null);

    const startDuo = () => {
        setStarted(true);
        setTimeLeft(5);

        // 5s 超时
        countdownRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    // 超时回退
                    setStarted(false);
                    setMyReady(false);
                    setPeerReady(false);
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        if (myReady && peerReady) {
            clearInterval(countdownRef.current);
            onSuccess();
        }
    }, [myReady, peerReady, onSuccess]);

    useEffect(() => () => {
        clearInterval(countdownRef.current);
        clearTimeout(timerRef.current);
    }, []);

    if (!started) {
        return (
            <div className="flex flex-col items-center gap-3">
                <motion.button
                    onClick={startDuo}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg"
                >
                    👫 双人合力开
                </motion.button>
                <span className="text-white/50 text-xs">需要两人同时确认</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-white/40 text-sm">⏱ 剩余 {timeLeft}s</div>
            <div className="flex gap-6">
                <motion.button
                    onClick={() => setMyReady(true)}
                    whileTap={{ scale: 0.9 }}
                    disabled={myReady}
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${myReady ? 'bg-green-500/30 border-green-400 text-green-300' : 'bg-white/10 border-white/20 text-white/70'
                        }`}
                >
                    <span className="text-2xl">{myReady ? '✅' : '👆'}</span>
                    <span className="text-xs">我</span>
                </motion.button>
                <motion.button
                    onClick={() => setPeerReady(true)}
                    whileTap={{ scale: 0.9 }}
                    disabled={peerReady}
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${peerReady ? 'bg-green-500/30 border-green-400 text-green-300' : 'bg-white/10 border-white/20 text-white/70'
                        }`}
                >
                    <span className="text-2xl">{peerReady ? '✅' : '👆'}</span>
                    <span className="text-xs">同伴</span>
                </motion.button>
            </div>
            <span className="text-white/40 text-xs">两人同时确认即可拆开</span>
        </div>
    );
};

// ============================================================
// OpenMethodRouter - 根据 openMethod 渲染对应组件
// ============================================================
export const OpenMethodRouter = ({ method, onSuccess, onCancel }) => {
    switch (method) {
        case 'shake': return <ShakeOpen onSuccess={onSuccess} onCancel={onCancel} />;
        case 'swipe': return <SwipeOpen onSuccess={onSuccess} onCancel={onCancel} />;
        case 'tap3': return <Tap3Open onSuccess={onSuccess} onCancel={onCancel} />;
        case 'duo': return <DuoOpen onSuccess={onSuccess} onCancel={onCancel} />;
        case 'press':
        default: return <PressOpen onSuccess={onSuccess} onCancel={onCancel} />;
    }
};
