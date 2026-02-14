/**
 * ============================================================
 * 红包金额分配算法模块 (hongbaoAlgo.js)
 * ============================================================
 * 
 * 手动测试清单 (Manual Test Checklist):
 * ----------------------------------------------------------
 * 1. min/max 校验：设 min=5元 max=10元 count=5 total=30元 → 应通过
 *    设 min=10元 count=5 total=30元 → 应报错"总金额不足"
 *    设 max=5元 count=5 total=30元 → 应报错"总金额超出封顶"
 * 2. 彩蛋总额超出：total=10元，eggs=[8.88, 5.00] → 应报错
 * 3. luckyTail 开关与强度：开启 tails=[8], strong → 观察尾数8比例
 * 4. varianceMode：balanced vs exciting → exciting 差异更大
 * 5. custom 模式校验：amounts 长度!=count → 报错;
 *    amounts 含负数 → 报错; 不满足 min/max → 报错
 * ----------------------------------------------------------
 * 
 * PRD 对齐:
 * - C2: 拼手气模式 (generateAmountsRandomCents)
 * - C3: 自定义模式 (validateSettings)
 * - 技术: 所有金额以"分"为单位运算
 */

// ============================================================
// 默认配置
// ============================================================
export const DEFAULT_SETTINGS = {
    count: 5,
    mode: 'random',           // 'random' | 'custom'
    totalAmountCents: 10000,  // 100.00 元
    customAmountsCents: [0, 0, 0, 0, 0],
    cover: 'default',
    openMethod: 'press',      // 'press'|'shake'|'swipe'|'tap3'|'duo'
    varianceMode: 'standard', // 'balanced'|'standard'|'exciting'
    clamp: { minCents: 1, maxCents: null }, // minCents=0.01元, maxCents=null(不封顶)
    eggs: { enabled: false, items: [], placement: 'randomIndex' },
    luckyTail: { enabled: false, tails: [8], strength: 'mid' },
    titleTheme: 'horse',      // 'horse'|'funny'|'blessing'|'company'
    titleGranularity: 'full', // 'kingOnly'|'top3AndMin'|'full'
};

// ============================================================
// validateSettings(settings) → { valid, error? }
// ============================================================
export function validateSettings(s) {
    // C1: 数量
    if (s.count < 2 || s.count > 10) {
        return { valid: false, error: '红包数量必须在 2~10 之间' };
    }

    const { minCents, maxCents } = s.clamp;

    // 保底必须 >= 0
    if (minCents < 0) {
        return { valid: false, error: '保底金额不能为负数' };
    }

    // 封顶必须 >= 保底（如果设置了封顶）
    if (maxCents !== null && maxCents < minCents) {
        return { valid: false, error: '封顶金额不能小于保底金额' };
    }

    // 彩蛋校验
    if (s.eggs.enabled) {
        if (s.eggs.items.length > 2) {
            return { valid: false, error: '彩蛋红包最多设置 2 个' };
        }
        for (let i = 0; i < s.eggs.items.length; i++) {
            const egg = s.eggs.items[i];
            if (egg < 0) return { valid: false, error: `彩蛋 #${i + 1} 金额不能为负` };
            if (egg < minCents) return { valid: false, error: `彩蛋 #${i + 1} 金额低于保底` };
            if (maxCents !== null && egg > maxCents) return { valid: false, error: `彩蛋 #${i + 1} 金额超过封顶` };
        }
    }

    if (s.mode === 'random') {
        if (s.totalAmountCents <= 0) {
            return { valid: false, error: '总金额必须大于 0' };
        }

        // 彩蛋金额不能超过总额
        const eggSum = s.eggs.enabled ? s.eggs.items.reduce((a, b) => a + b, 0) : 0;
        if (eggSum > s.totalAmountCents) {
            return { valid: false, error: '彩蛋金额之和超过了总金额' };
        }

        // 剩余金额够不够给剩余红包分保底
        const remaining = s.totalAmountCents - eggSum;
        const remainingCount = s.count - (s.eggs.enabled ? s.eggs.items.length : 0);
        if (remainingCount > 0 && remaining < minCents * remainingCount) {
            return { valid: false, error: `总金额不足以给每个红包分配保底 ¥${(minCents / 100).toFixed(2)}` };
        }
        if (maxCents !== null && remainingCount > 0 && remaining > maxCents * remainingCount) {
            return { valid: false, error: `总金额超过了封顶限制（每包最多 ¥${(maxCents / 100).toFixed(2)}）` };
        }
    }

    if (s.mode === 'custom') {
        if (!s.customAmountsCents || s.customAmountsCents.length !== s.count) {
            return { valid: false, error: `请输入 ${s.count} 个金额` };
        }
        for (let i = 0; i < s.customAmountsCents.length; i++) {
            const amt = s.customAmountsCents[i];
            if (isNaN(amt) || amt < 0) {
                return { valid: false, error: `第 ${i + 1} 个红包金额不合法` };
            }
            if (amt < minCents) {
                return { valid: false, error: `第 ${i + 1} 个红包低于保底 ¥${(minCents / 100).toFixed(2)}` };
            }
            if (maxCents !== null && amt > maxCents) {
                return { valid: false, error: `第 ${i + 1} 个红包超过封顶 ¥${(maxCents / 100).toFixed(2)}` };
            }
        }
        const sum = s.customAmountsCents.reduce((a, b) => a + b, 0);
        if (sum <= 0) {
            return { valid: false, error: '自定义金额总和必须大于 0' };
        }
    }

    return { valid: true };
}

// ============================================================
// applyVarianceModeUpperBound(avgCents, varianceMode)
// 返回每次随机抽取的倍率上限
// ============================================================
export function applyVarianceModeUpperBound(avgCents, varianceMode) {
    switch (varianceMode) {
        case 'balanced': return Math.floor(avgCents * 1.1); // 1.2 -> 1.1 (更均匀)
        case 'exciting': return Math.floor(avgCents * 4.0); // 2.5 -> 4.0 (更刺激)
        case 'standard':
        default: return Math.floor(avgCents * 2.0);
    }
}

// ============================================================
// generateAmountsRandomCents(totalCents, count, varianceMode, clamp)
// 二倍均值法 + variance + clamp
// ============================================================
export function generateAmountsRandomCents(totalCents, count, varianceMode = 'standard', clamp = { minCents: 1, maxCents: null }) {
    const { minCents, maxCents } = clamp;
    const amounts = [];
    let remainCents = totalCents;
    let remainCount = count;

    for (let i = 0; i < count; i++) {
        remainCount = count - i;
        if (remainCount === 1) {
            // 最后一个人拿完
            amounts.push(remainCents);
            break;
        }

        const avgCents = remainCents / remainCount;
        let upperBound = applyVarianceModeUpperBound(avgCents, varianceMode);

        // 必须给后面的人留够 minCents
        const mustLeave = minCents * (remainCount - 1);
        const canTake = remainCents - mustLeave;

        // upper 取 min(upperBound, canTake, maxCents)
        upperBound = Math.min(upperBound, canTake);
        if (maxCents !== null) {
            upperBound = Math.min(upperBound, maxCents);
        }

        // lower 取 max(minCents, 1) —— 至少 1 分或保底
        let lowerBound = Math.max(minCents, 0);

        // 安全检查
        if (lowerBound > upperBound) {
            lowerBound = upperBound;
        }

        const amount = lowerBound + Math.floor(Math.random() * (upperBound - lowerBound + 1));
        amounts.push(amount);
        remainCents -= amount;
    }

    return amounts;
}

// ============================================================
// applyEggs(settings) → { eggIndices, remainTotal, remainCount }
// 从 count 个位置中随机选出 k 个放彩蛋
// ============================================================
export function applyEggs(settings) {
    const { count, eggs } = settings;
    if (!eggs.enabled || eggs.items.length === 0) {
        return { eggIndices: [], eggAmounts: [], remainTotalCents: settings.totalAmountCents, remainCount: count };
    }

    const eggCount = eggs.items.length;
    const eggSum = eggs.items.reduce((a, b) => a + b, 0);

    // 随机选 k 个索引放彩蛋
    const allIndices = Array.from({ length: count }, (_, i) => i);
    // Fisher-Yates 取前 k 个
    for (let i = allIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }
    const eggIndices = allIndices.slice(0, eggCount).sort((a, b) => a - b);

    return {
        eggIndices,
        eggAmounts: [...eggs.items],
        remainTotalCents: settings.totalAmountCents - eggSum,
        remainCount: count - eggCount,
    };
}

// ============================================================
// applyClamp(amounts, clamp) → boolean (mutates in place)
// 事后校验所有金额是否满足 clamp；不满足返回 false
// ============================================================
export function applyClamp(amounts, clamp) {
    const { minCents, maxCents } = clamp;
    for (const amt of amounts) {
        if (amt < minCents) return false;
        if (maxCents !== null && amt > maxCents) return false;
    }
    return true;
}

// ============================================================
// applyLuckyTailPostProcess(amounts, luckyTail, clamp)
// 有限次微调，使尽可能多的金额尾数命中 tails
// ============================================================
export function applyLuckyTailPostProcess(amounts, luckyTail, clamp) {
    if (!luckyTail.enabled || luckyTail.tails.length === 0) return amounts;

    const result = [...amounts];
    const totalCents = result.reduce((a, b) => a + b, 0);
    const { tails, strength } = luckyTail;
    const { minCents, maxCents } = clamp;

    // 根据强度决定尝试次数
    const maxAttempts = strength === 'weak' ? 50 : strength === 'strong' ? 200 : 100;

    const isLucky = (val) => tails.includes(val % 10);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 找一个未命中的 index
        const unlucky = [];
        for (let i = 0; i < result.length; i++) {
            if (!isLucky(result[i])) unlucky.push(i);
        }
        if (unlucky.length === 0) break; // 所有的都命中了

        const idx = unlucky[Math.floor(Math.random() * unlucky.length)];
        // 找另一个 index 做补偿
        const other = Math.floor(Math.random() * result.length);
        if (other === idx) continue;

        // 尝试 delta 1~9
        for (let d = 1; d <= 9; d++) {
            const newVal = result[idx] + d;
            const newOther = result[other] - d;

            if (newOther < 0) continue;
            if (newVal < minCents || newOther < minCents) continue;
            if (maxCents !== null && (newVal > maxCents || newOther > maxCents)) continue;
            if (!isLucky(newVal)) continue;

            // 验证总和不变
            if (newVal + newOther !== result[idx] + result[other]) continue;

            result[idx] = newVal;
            result[other] = newOther;
            break;
        }

        // 也尝试减
        for (let d = 1; d <= 9; d++) {
            if (isLucky(result[idx])) break; // 已经被上面的循环修好了
            const newVal = result[idx] - d;
            const newOther = result[other] + d;

            if (newVal < 0) continue;
            if (newVal < minCents || newOther < minCents) continue;
            if (maxCents !== null && (newVal > maxCents || newOther > maxCents)) continue;
            if (!isLucky(newVal)) continue;

            result[idx] = newVal;
            result[other] = newOther;
            break;
        }
    }

    return result;
}

// ============================================================
// buildEnvelopes(settings) → envelope[]
// 主入口：生成完整的红包数组
// ============================================================
export function buildEnvelopes(settings) {
    const s = settings;
    let allAmounts;

    if (s.mode === 'custom') {
        // 自定义模式：直接使用用户输入的金额
        allAmounts = [...s.customAmountsCents];

        // 幸运尾数后处理（保持总和不变）
        allAmounts = applyLuckyTailPostProcess(allAmounts, s.luckyTail, s.clamp);
    } else {
        // 拼手气模式
        // Step 1: 处理彩蛋
        const { eggIndices, eggAmounts, remainTotalCents, remainCount } = applyEggs(s);

        // Step 2: 生成剩余红包金额
        let normalAmounts = [];
        if (remainCount > 0) {
            normalAmounts = generateAmountsRandomCents(remainTotalCents, remainCount, s.varianceMode, s.clamp);
        }

        // Step 3: 幸运尾数后处理
        normalAmounts = applyLuckyTailPostProcess(normalAmounts, s.luckyTail, s.clamp);

        // Step 4: 合并彩蛋到正确位置
        allAmounts = new Array(s.count);
        let normalIdx = 0;
        for (let i = 0; i < s.count; i++) {
            const eggPos = eggIndices.indexOf(i);
            if (eggPos !== -1) {
                allAmounts[i] = eggAmounts[eggPos];
            } else {
                allAmounts[i] = normalAmounts[normalIdx++];
            }
        }

        // Step 5: 最终洗牌（让位置随机）
        for (let i = allAmounts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allAmounts[i], allAmounts[j]] = [allAmounts[j], allAmounts[i]];
        }
    }

    // 构建红包对象数组
    return allAmounts.map((amountCents, i) => ({
        id: `env-${i}-${Date.now()}`,
        amountCents,
        opened: false,
        openedBy: null,
        title: null,
    }));
}

// ============================================================
// Utility: 分转元（展示用）
// ============================================================
export function centsToYuan(cents) {
    return (cents / 100).toFixed(2);
}
