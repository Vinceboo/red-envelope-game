// Prize pool definition
// 0, 8, 88, 188, 288, 388, 488, 588, 688, 788, 888
export const PRIZE_POOL = [0, 8, 88, 188, 288, 388, 488, 588, 688, 788, 888];

/**
 * Draws a random prize from the pool.
 * Currently uses uniform probability.
 * @returns {number} The amount won.
 */
export const drawPrize = () => {
    const randomIndex = Math.floor(Math.random() * PRIZE_POOL.length);
    return PRIZE_POOL[randomIndex];
};

/**
 * Generates initial envelopes State
 * @param {number} count Number of envelopes
 */
export const generateEnvelopes = (count = 10) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        status: 'idle', // idle, selected, hidden (others), opened
        amount: null
    }));
};
