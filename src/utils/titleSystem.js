/**
 * ============================================================
 * 称号系统 (titleSystem.js)
 * ============================================================
 * 
 * PRD: E) 称号系统 + 荣誉墙
 * 
 * 手动测试清单:
 * - titleGranularity: 
 *   kingOnly → 只有手气王有称号
 *   top3AndMin → top3 + 最低有称号
 *   full → 所有人都有称号
 * - titleTheme: horse/funny/blessing/company → 文案不同
 * - luckyTail winners 正确识别
 */

// ============================================================
// 称号文案包 (Title Theme Packs)
// ============================================================
const TITLE_PACKS = {
    horse: {
        king: { key: 'king', text: '🏆 马到成功王' },
        second: { key: 'second', text: '🥈 一马当先' },
        third: { key: 'third', text: '🥉 万马奔腾' },
        min: { key: 'min', text: '🎠 细水长流' },
        stable: { key: 'stable', text: '🎯 稳如泰山' },
        lucky: { key: 'lucky', text: '🍀 幸运尾数' },
        normal: { key: 'normal', text: '🧧 红包到手' },
    },
    funny: {
        king: { key: 'king', text: '🏆 欧皇降临' },
        second: { key: 'second', text: '🥈 差一点王者' },
        third: { key: 'third', text: '🥉 探花郎' },
        min: { key: 'min', text: '😅 非酋认证' },
        stable: { key: 'stable', text: '🧮 人间理财' },
        lucky: { key: 'lucky', text: '🎰 尾数大师' },
        normal: { key: 'normal', text: '🫢 吃瓜群众' },
    },
    blessing: {
        king: { key: 'king', text: '🏆 福星高照' },
        second: { key: 'second', text: '🥈 喜气洋洋' },
        third: { key: 'third', text: '🥉 瑞气千条' },
        min: { key: 'min', text: '🙏 心诚则灵' },
        stable: { key: 'stable', text: '☯️ 中庸之道' },
        lucky: { key: 'lucky', text: '🍀 吉星高照' },
        normal: { key: 'normal', text: '🧧 恭喜发财' },
    },
    company: {
        king: { key: 'king', text: '🏆 年度手气王' },
        second: { key: 'second', text: '🥈 副总裁级手气' },
        third: { key: 'third', text: '🥉 总监级手气' },
        min: { key: 'min', text: '💼 稳稳当当' },
        stable: { key: 'stable', text: '📊 数据分析师' },
        lucky: { key: 'lucky', text: '🎯 精准命中' },
        normal: { key: 'normal', text: '🤝 团队精神' },
    },
};

// ============================================================
// computeStatsAndTitles(envelopes, settings) → stats
// ============================================================
export function computeStatsAndTitles(envelopes, settings) {
    const { titleTheme, titleGranularity, luckyTail } = settings;
    const pack = TITLE_PACKS[titleTheme] || TITLE_PACKS.horse;

    // 只处理已开启的红包
    const opened = envelopes.filter(e => e.opened && e.openedBy);
    if (opened.length === 0) {
        return {
            openedList: [],
            meanCents: 0,
            maxEntry: null,
            minEntry: null,
            closestEntry: null,
            luckyWinners: [],
            allTitles: {},
        };
    }

    // 基础统计
    const amounts = opened.map(e => e.amountCents);
    const totalCents = amounts.reduce((a, b) => a + b, 0);
    const meanCents = Math.round(totalCents / amounts.length);

    // 排序找 max/min
    const sorted = [...opened].sort((a, b) => b.amountCents - a.amountCents);
    const maxEntry = sorted[0];
    const minEntry = sorted[sorted.length - 1];

    // 最接近平均值
    let closestEntry = opened[0];
    let closestDist = Math.abs(opened[0].amountCents - meanCents);
    for (const e of opened) {
        const dist = Math.abs(e.amountCents - meanCents);
        if (dist < closestDist) {
            closestDist = dist;
            closestEntry = e;
        }
    }

    // 幸运尾数
    const luckyWinners = [];
    if (luckyTail.enabled && luckyTail.tails.length > 0) {
        for (const e of opened) {
            if (luckyTail.tails.includes(e.amountCents % 10)) {
                luckyWinners.push(e);
            }
        }
    }

    // 分配称号
    const allTitles = {}; // id → title object

    if (titleGranularity === 'kingOnly') {
        // 只给手气王
        allTitles[maxEntry.id] = pack.king;
    } else if (titleGranularity === 'top3AndMin') {
        // top3 + min
        allTitles[sorted[0].id] = pack.king;
        if (sorted.length > 1) allTitles[sorted[1].id] = pack.second;
        if (sorted.length > 2) allTitles[sorted[2].id] = pack.third;
        if (minEntry.id !== sorted[0].id) allTitles[minEntry.id] = pack.min;
    } else {
        // full: 每个人都有称号
        allTitles[sorted[0].id] = pack.king;
        if (sorted.length > 1 && !allTitles[sorted[1].id]) allTitles[sorted[1].id] = pack.second;
        if (sorted.length > 2 && !allTitles[sorted[2].id]) allTitles[sorted[2].id] = pack.third;
        if (!allTitles[minEntry.id]) allTitles[minEntry.id] = pack.min;
        if (!allTitles[closestEntry.id]) allTitles[closestEntry.id] = pack.stable;

        // 幸运尾数标签
        for (const e of luckyWinners) {
            if (!allTitles[e.id]) allTitles[e.id] = pack.lucky;
        }

        // 剩余的给"普通"
        for (const e of opened) {
            if (!allTitles[e.id]) allTitles[e.id] = pack.normal;
        }
    }

    return {
        openedList: opened.map(e => ({
            id: e.id,
            uid: e.openedBy?.uid,
            name: e.openedBy?.name,
            amountCents: e.amountCents,
            at: e.openedBy?.at,
        })),
        meanCents,
        maxEntry: { id: maxEntry.id, amountCents: maxEntry.amountCents, name: maxEntry.openedBy?.name },
        minEntry: { id: minEntry.id, amountCents: minEntry.amountCents, name: minEntry.openedBy?.name },
        closestEntry: { id: closestEntry.id, amountCents: closestEntry.amountCents, name: closestEntry.openedBy?.name },
        luckyWinners: luckyWinners.map(e => ({ id: e.id, amountCents: e.amountCents, name: e.openedBy?.name })),
        allTitles,
    };
}

export { TITLE_PACKS };
