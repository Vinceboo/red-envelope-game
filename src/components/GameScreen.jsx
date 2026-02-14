/**
 * GameScreen 组件 (增强版)
 * PRD: D) 游戏页交互升级
 * 
 * 手动测试清单:
 * - 摇一摇不可用降级: 桌面浏览器无 devicemotion → 自动降级为长按
 * - duo 模拟: 点击"双人合力开" → 两个按钮都点击 → 5s 超时回退
 * - 同一红包已 opened → 显示"已拆"，禁用再次开启
 * - 荣誉墙: 拆完多个后展开荣誉墙查看称号
 * - titleGranularity 三档: 切换查看不同表现
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RedEnvelope } from './RedEnvelope';
import { ResultModal } from './ResultModal';
import { HonorWall } from './HonorWall';
import { centsToYuan } from '../utils/hongbaoAlgo';
import { computeStatsAndTitles } from '../utils/titleSystem';
import { ArrowLeft, Settings } from 'lucide-react';

export const GameScreen = ({ envelopes: initialEnvelopes, settings, onBack, onSettings }) => {
    const [gameState, setGameState] = useState('idle'); // idle, selecting, ready, opening, result
    const [envelopes, setEnvelopes] = useState(initialEnvelopes);
    const [selectedId, setSelectedId] = useState(null);
    const [prizeAmountCents, setPrizeAmountCents] = useState(0);
    const [lastOpenedTitle, setLastOpenedTitle] = useState(null);

    // 实时计算统计与称号
    const stats = useMemo(() => computeStatsAndTitles(envelopes, settings), [envelopes, settings]);

    // 将称号写回到信封上（用于网格展示）
    const envelopesWithTitles = useMemo(() =>
        envelopes.map(env => ({
            ...env,
            title: stats.allTitles[env.id] || null,
        })),
        [envelopes, stats]
    );

    const handleSelect = (id) => {
        if (gameState !== 'idle') return;
        const env = envelopes.find(e => e.id === id);
        if (!env || env.opened) return;

        setGameState('selecting');
        setSelectedId(id);

        setEnvelopes(prev => prev.map(e => ({
            ...e,
            status: e.id === id ? 'selected' : 'hidden'
        })));

        setTimeout(() => setGameState('ready'), 600);
    };

    const handleOpenSuccess = useCallback(() => {
        if (gameState !== 'ready') return;
        setGameState('opening');

        const selected = envelopes.find(e => e.id === selectedId);
        const amount = selected?.amountCents ?? 0;
        setPrizeAmountCents(amount);

        // 标记为已开启
        const playerName = `玩家${String.fromCharCode(65 + envelopes.filter(e => e.opened).length)}`; // A, B, C...
        setEnvelopes(prev => prev.map(e =>
            e.id === selectedId
                ? { ...e, opened: true, status: 'idle', openedBy: { uid: `user-${Date.now()}`, name: playerName, at: Date.now() } }
                : { ...e, status: 'idle' }
        ));

        setTimeout(() => setGameState('result'), 800);
    }, [gameState, selectedId, envelopes]);

    const handleRestart = () => {
        setGameState('idle');
        setSelectedId(null);
        setPrizeAmountCents(0);
        setLastOpenedTitle(null);
    };

    // 计算网格列数
    const count = envelopes.length;
    const gridCols = count <= 4 ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-5';

    // 已开启数/总数
    const openedCount = envelopes.filter(e => e.opened).length;
    const allOpened = openedCount === count;

    return (
        <>
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-4 text-center z-10 relative"
            >
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-[var(--color-ios-gold)]/20 mb-4">
                    <span className="text-lg">🐎</span>
                    <span className="text-sm font-bold text-[var(--color-ios-gold)] uppercase tracking-[0.2em]">丙午马年</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    新年快乐
                </h1>
                <p className="text-white/50 text-sm font-medium">
                    {allOpened ? '🎊 所有红包已拆完！' : `点击红包开启好运 (${openedCount}/${count})`}
                </p>
            </motion.div>

            {/* Honor Wall */}
            <HonorWall stats={stats} settings={settings} />

            {/* Navigation */}
            {gameState === 'idle' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed top-4 left-4 z-50 flex gap-2">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <button onClick={onSettings} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors">
                        <Settings size={18} />
                    </button>
                </motion.div>
            )}

            {/* Game Area */}
            <div className="w-full max-w-5xl relative z-0 min-h-[500px] flex items-center justify-center perspective-1000">
                <AnimatePresence mode="popLayout">
                    {selectedId === null || gameState === 'idle' ? (
                        <motion.div
                            key="grid"
                            className={`grid ${gridCols} gap-6 md:gap-10 w-full place-items-center px-4 pb-24`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        >
                            {envelopesWithTitles.map((env, index) => (
                                <RedEnvelope
                                    key={env.id}
                                    {...env}
                                    status={env.opened ? 'idle' : env.status || 'idle'}
                                    index={index}
                                    onSelect={handleSelect}
                                    layoutId={`envelope-${env.id}`}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        gameState !== 'result' && gameState !== 'idle' && (
                            <motion.div
                                key="selected"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center justify-center w-full absolute inset-0 z-50 gap-8"
                            >
                                {/* 放大的红包 */}
                                {envelopesWithTitles.filter(e => e.id === selectedId).map(env => (
                                    <RedEnvelope
                                        key={env.id}
                                        {...env}
                                        status="ready"
                                        openMethod={settings.openMethod}
                                        onOpen={handleOpenSuccess}
                                        isInteractive={true}
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
                    <ResultModal
                        amount={centsToYuan(prizeAmountCents)}
                        title={stats.allTitles[selectedId]}
                        onRestart={handleRestart}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
