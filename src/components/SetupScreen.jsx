/**
 * 设置页组件 (SetupScreen)
 * PRD: B) 设置页 UI
 * 
 * 包含所有配置项:
 * - C1: 数量选择器
 * - C2/C3: 金额模式 (拼手气/自定义)
 * - openMethod: 开法皮肤
 * - varianceMode: 分布风格
 * - clamp: 保底/封顶
 * - eggs: 彩蛋
 * - luckyTail: 幸运尾数
 * - titleTheme/titleGranularity: 称号系统
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Shuffle, PenLine, ChevronRight, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { validateSettings, centsToYuan } from '../utils/hongbaoAlgo';

// ============================================================
// 折叠面板
// ============================================================
const CollapsibleSection = ({ title, emoji, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden mb-4">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left bg-white/5 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-2">
                    <span>{emoji}</span>
                    <span className="text-white/70 text-sm font-semibold">{title}</span>
                </div>
                {open ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 py-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================
// 单选按钮组
// ============================================================
const RadioGroup = ({ options, value, onChange, cols = 2 }) => (
    <div className={`grid grid-cols-${cols} gap-2`}>
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-center ${value === opt.value
                        ? 'bg-[var(--color-ios-gold)] text-black shadow-lg'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
            >
                {opt.icon && <span className="mr-1">{opt.icon}</span>}
                {opt.label}
            </button>
        ))}
    </div>
);

// ============================================================
// 主组件
// ============================================================
export const SetupScreen = ({ config, onConfigChange, onStart }) => {
    const [activeTab, setActiveTab] = useState(config.mode);

    const update = (patch) => onConfigChange({ ...config, ...patch });
    const updateClamp = (patch) => update({ clamp: { ...config.clamp, ...patch } });
    const updateEggs = (patch) => update({ eggs: { ...config.eggs, ...patch } });
    const updateLuckyTail = (patch) => update({ luckyTail: { ...config.luckyTail, ...patch } });

    // 数量变更
    const handleCountChange = (n) => {
        const count = Math.max(2, Math.min(10, n));
        update({ count, customAmountsCents: Array(count).fill(0) });
    };

    const handleModeChange = (mode) => {
        setActiveTab(mode);
        update({ mode });
    };

    const handleCustomAmountChange = (i, yuan) => {
        const amounts = [...config.customAmountsCents];
        amounts[i] = Math.round((parseFloat(yuan) || 0) * 100);
        update({ customAmountsCents: amounts });
    };

    const handleEggAmountChange = (i, yuan) => {
        const items = [...config.eggs.items];
        items[i] = Math.round((parseFloat(yuan) || 0) * 100);
        updateEggs({ items });
    };

    // 校验
    const validation = useMemo(() => validateSettings(config), [config]);

    const customTotalCents = config.customAmountsCents.reduce((a, b) => a + b, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto z-10 relative px-4 pb-20"
        >
            {/* Title */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-[var(--color-ios-gold)]/20 mb-5">
                    <span className="text-lg">🧧</span>
                    <span className="text-sm font-bold text-[var(--color-ios-gold)] uppercase tracking-[0.2em]">红包工具</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-2xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    自定义红包
                </h1>
                <p className="text-white/40 text-sm">设置红包数量和金额，开始分发</p>
            </div>

            {/* Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">

                {/* ==================== 红包数量 ==================== */}
                <div className="mb-6">
                    <label className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2 block">红包数量</label>
                    <div className="flex items-center justify-between bg-black/20 rounded-2xl px-4 py-3">
                        <button onClick={() => handleCountChange(config.count - 1)} disabled={config.count <= 2} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30">
                            <Minus size={18} />
                        </button>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{config.count}</span>
                            <span className="text-white/30 text-sm">个</span>
                        </div>
                        <button onClick={() => handleCountChange(config.count + 1)} disabled={config.count >= 10} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white disabled:opacity-30">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                {/* ==================== 分配方式 Tab ==================== */}
                <div className="mb-5">
                    <label className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2 block">分配方式</label>
                    <div className="flex gap-2 bg-black/20 rounded-xl p-1">
                        <button onClick={() => handleModeChange('random')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'random' ? 'bg-[var(--color-ios-gold)] text-black shadow-lg' : 'text-white/50'}`}>
                            <Shuffle size={14} /> 拼手气
                        </button>
                        <button onClick={() => handleModeChange('custom')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'custom' ? 'bg-[var(--color-ios-gold)] text-black shadow-lg' : 'text-white/50'}`}>
                            <PenLine size={14} /> 自定义
                        </button>
                    </div>
                </div>

                {/* ==================== 金额区域 ==================== */}
                <AnimatePresence mode="wait">
                    {activeTab === 'random' ? (
                        <motion.div key="random" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="mb-5">
                            <label className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2 block">总金额 (元)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--color-ios-gold)] font-bold">¥</span>
                                <input
                                    type="number" min="0.01" step="0.01"
                                    value={config.totalAmountCents ? (config.totalAmountCents / 100).toString() : ''}
                                    onChange={(e) => update({ totalAmountCents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                                    placeholder="100.00"
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 pl-12 py-3 text-2xl text-white font-bold text-right outline-none focus:border-[var(--color-ios-gold)]/50 transition-all placeholder:text-white/15"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="custom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mb-5">
                            <label className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2 block">每个红包金额 (元)</label>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {config.customAmountsCents.map((cents, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-white/20 text-xs w-5 text-right">#{i + 1}</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-ios-gold)]">¥</span>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={cents ? (cents / 100).toString() : ''}
                                                onChange={(e) => handleCustomAmountChange(i, e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 pl-7 py-2 text-white text-right text-sm outline-none focus:border-[var(--color-ios-gold)]/50 transition-all placeholder:text-white/15"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                                <span className="text-white/30 text-xs">合计</span>
                                <span className="text-[var(--color-ios-gold)] font-bold text-sm">¥{centsToYuan(customTotalCents)}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ==================== 高级设置 (折叠) ==================== */}

                {/* 开法皮肤 */}
                <CollapsibleSection title="开法皮肤" emoji="🎮" defaultOpen={false}>
                    <RadioGroup
                        options={[
                            { value: 'press', label: '长按', icon: '👆' },
                            { value: 'shake', label: '摇一摇', icon: '📱' },
                            { value: 'swipe', label: '划封条', icon: '👉' },
                            { value: 'tap3', label: '连点三次', icon: '✌️' },
                            { value: 'duo', label: '双人合力', icon: '👫' },
                        ]}
                        value={config.openMethod}
                        onChange={(v) => update({ openMethod: v })}
                        cols={3}
                    />
                </CollapsibleSection>

                {/* 分布风格 */}
                <CollapsibleSection title="分布风格" emoji="📊">
                    <RadioGroup
                        options={[
                            { value: 'balanced', label: '均衡（差异小）' },
                            { value: 'standard', label: '标准（类微信）' },
                            { value: 'exciting', label: '刺激（差异大）' },
                        ]}
                        value={config.varianceMode}
                        onChange={(v) => update({ varianceMode: v })}
                        cols={3}
                    />
                </CollapsibleSection>

                {/* 保底/封顶 */}
                <CollapsibleSection title="保底 / 封顶" emoji="🛡️">
                    <div className="space-y-3">
                        <div>
                            <label className="text-white/40 text-xs mb-1 block">保底金额 (元)</label>
                            <input
                                type="number" min="0" step="0.01"
                                value={config.clamp.minCents ? (config.clamp.minCents / 100).toString() : ''}
                                onChange={(e) => updateClamp({ minCents: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                                placeholder="0.01"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[var(--color-ios-gold)]/50 placeholder:text-white/15"
                            />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs mb-1 block">封顶金额 (元, 留空=不限)</label>
                            <input
                                type="number" min="0" step="0.01"
                                value={config.clamp.maxCents ? (config.clamp.maxCents / 100).toString() : ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    updateClamp({ maxCents: val > 0 ? Math.round(val * 100) : null });
                                }}
                                placeholder="不限制"
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[var(--color-ios-gold)]/50 placeholder:text-white/15"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* 彩蛋红包 */}
                <CollapsibleSection title="彩蛋红包" emoji="🥚">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.eggs.enabled} onChange={(e) => updateEggs({ enabled: e.target.checked, items: e.target.checked ? config.eggs.items : [] })} className="accent-[var(--color-ios-gold)] w-4 h-4" />
                            <span className="text-white/60 text-sm">启用彩蛋（指定金额 0~2 个）</span>
                        </label>
                        {config.eggs.enabled && (
                            <div className="space-y-2">
                                {[0, 1].map(i => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-white/20 text-xs">#{i + 1}</span>
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={config.eggs.items[i] != null ? (config.eggs.items[i] / 100).toString() : ''}
                                            onChange={(e) => handleEggAmountChange(i, e.target.value)}
                                            placeholder={i === 0 ? '88.88' : '13.14 (可选)'}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[var(--color-ios-gold)]/50 placeholder:text-white/15"
                                        />
                                        {i > 0 && config.eggs.items.length > 1 && (
                                            <button onClick={() => updateEggs({ items: config.eggs.items.slice(0, i) })} className="text-red-400 text-xs">✕</button>
                                        )}
                                    </div>
                                ))}
                                {config.eggs.items.length < 2 && (
                                    <button onClick={() => updateEggs({ items: [...config.eggs.items, 0] })} className="text-[var(--color-ios-gold)] text-xs">+ 添加彩蛋金额</button>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>

                {/* 幸运尾数 */}
                <CollapsibleSection title="幸运尾数偏好" emoji="🍀">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={config.luckyTail.enabled} onChange={(e) => updateLuckyTail({ enabled: e.target.checked })} className="accent-[var(--color-ios-gold)] w-4 h-4" />
                            <span className="text-white/60 text-sm">启用尾数偏好</span>
                        </label>
                        {config.luckyTail.enabled && (
                            <>
                                <div>
                                    <label className="text-white/40 text-xs mb-1 block">偏好尾数</label>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    const tails = config.luckyTail.tails.includes(d)
                                                        ? config.luckyTail.tails.filter(t => t !== d)
                                                        : [...config.luckyTail.tails, d];
                                                    updateLuckyTail({ tails });
                                                }}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${config.luckyTail.tails.includes(d)
                                                        ? 'bg-[var(--color-ios-gold)] text-black'
                                                        : 'bg-white/5 text-white/30'
                                                    }`}
                                            >{d}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-white/40 text-xs mb-1 block">强度</label>
                                    <RadioGroup
                                        options={[
                                            { value: 'weak', label: '弱' },
                                            { value: 'mid', label: '中' },
                                            { value: 'strong', label: '强' },
                                        ]}
                                        value={config.luckyTail.strength}
                                        onChange={(v) => updateLuckyTail({ strength: v })}
                                        cols={3}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </CollapsibleSection>

                {/* 称号系统 */}
                <CollapsibleSection title="称号系统" emoji="🏅">
                    <div className="space-y-3">
                        <div>
                            <label className="text-white/40 text-xs mb-1 block">称号主题</label>
                            <RadioGroup
                                options={[
                                    { value: 'horse', label: '🐎 马年' },
                                    { value: 'funny', label: '😂 搞笑' },
                                    { value: 'blessing', label: '🙏 祝福' },
                                    { value: 'company', label: '💼 职场' },
                                ]}
                                value={config.titleTheme}
                                onChange={(v) => update({ titleTheme: v })}
                                cols={2}
                            />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs mb-1 block">称号颗粒度</label>
                            <RadioGroup
                                options={[
                                    { value: 'kingOnly', label: '只显手气王' },
                                    { value: 'top3AndMin', label: 'Top3+最低' },
                                    { value: 'full', label: '人人有称号' },
                                ]}
                                value={config.titleGranularity}
                                onChange={(v) => update({ titleGranularity: v })}
                                cols={3}
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* ==================== 校验提示 ==================== */}
                {!validation.valid && (
                    <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs">
                        ⚠️ {validation.error}
                    </div>
                )}

                {/* ==================== 开始按钮 ==================== */}
                <motion.button
                    whileTap={validation.valid ? { scale: 0.97 } : {}}
                    onClick={validation.valid ? onStart : undefined}
                    disabled={!validation.valid}
                    className={`w-full py-4 rounded-2xl text-lg font-bold tracking-wide shadow-lg flex items-center justify-center gap-2 border transition-all ${validation.valid
                            ? 'bg-gradient-to-r from-[var(--color-ios-red)] to-[var(--color-ios-red-dark)] text-white border-white/10 hover:brightness-110 cursor-pointer'
                            : 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed'
                        }`}
                >
                    <Gift size={20} />
                    塞钱进红包
                    <ChevronRight size={18} />
                </motion.button>
            </div>

            <div className="mt-6 text-center text-white/15 text-xs font-medium tracking-widest uppercase">
                2026 丙午马年 · 红包工具
            </div>
        </motion.div>
    );
};
