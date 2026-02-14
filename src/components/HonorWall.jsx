/**
 * 荣誉墙组件 (HonorWall)
 * PRD: E) 称号系统 + 荣誉墙
 * 毛玻璃风格固定卡片
 */

import { motion, AnimatePresence } from 'framer-motion';
import { centsToYuan } from '../utils/hongbaoAlgo';
import { Trophy, TrendingDown, Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export const HonorWall = ({ stats, settings }) => {
    const [expanded, setExpanded] = useState(false);

    if (!stats || stats.openedList.length === 0) return null;

    const { maxEntry, minEntry, closestEntry, luckyWinners, allTitles, meanCents, openedList } = stats;

    const honors = [
        maxEntry && { icon: <Trophy size={16} className="text-yellow-400" />, label: '手气王', name: maxEntry.name || '???', amount: maxEntry.amountCents, title: allTitles[maxEntry.id] },
        minEntry && minEntry.id !== maxEntry?.id && { icon: <TrendingDown size={16} className="text-blue-300" />, label: '最低手气', name: minEntry.name || '???', amount: minEntry.amountCents, title: allTitles[minEntry.id] },
        closestEntry && closestEntry.id !== maxEntry?.id && closestEntry.id !== minEntry?.id && { icon: <Target size={16} className="text-green-300" />, label: '最稳', name: closestEntry.name || '???', amount: closestEntry.amountCents, title: allTitles[closestEntry.id] },
        ...luckyWinners.slice(0, 2).map(w => ({
            icon: <Sparkles size={16} className="text-purple-300" />,
            label: '幸运尾数',
            name: w.name || '???',
            amount: w.amountCents,
            title: allTitles[w.id],
        })),
    ].filter(Boolean);

    if (honors.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto mb-6 z-20 relative"
        >
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏅</span>
                        <span className="text-white/80 text-sm font-semibold">荣誉墙</span>
                        <span className="text-white/30 text-xs">({openedList.length} 人已拆)</span>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                </button>

                {/* Content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 space-y-2">
                                {/* Average */}
                                <div className="text-center text-white/30 text-xs py-1 border-t border-white/5">
                                    平均 ¥{centsToYuan(meanCents)}
                                </div>

                                {/* Honor Cards */}
                                {honors.map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2"
                                    >
                                        {h.icon}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/80 text-sm font-medium truncate">{h.name}</span>
                                                {h.title && (
                                                    <span className="text-xs bg-[var(--color-ios-gold)]/20 text-[var(--color-ios-gold)] px-2 py-0.5 rounded-full whitespace-nowrap">
                                                        {h.title.text}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-white/40 text-xs">{h.label}</span>
                                        </div>
                                        <span className="text-white font-bold text-sm">¥{centsToYuan(h.amount)}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
