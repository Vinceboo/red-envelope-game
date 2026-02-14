import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sparkle = ({ x, y, color }) => {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
            animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                x: (Math.random() - 0.5) * 100, // Random spread X
                y: (Math.random() - 0.5) * 100, // Random spread Y
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
                position: 'fixed',
                left: x,
                top: y,
                width: Math.random() * 6 + 4 + 'px',
                height: Math.random() * 6 + 4 + 'px',
                borderRadius: '50%',
                backgroundColor: color,
                pointerEvents: 'none',
                zIndex: 9999,
                boxShadow: `0 0 10px ${color}`,
            }}
        />
    );
};

export const ClickSparkles = () => {
    const [sparkles, setSparkles] = useState([]);

    useEffect(() => {
        const handleClick = (e) => {
            const x = e.clientX;
            const y = e.clientY;
            const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
                id: Date.now() + i,
                x,
                y,
                color: Math.random() > 0.5 ? '#FFD60A' : '#FFA000', // Gold shades
            }));

            setSparkles(prev => [...prev, ...newSparkles]);

            // Cleanup old sparkles
            setTimeout(() => {
                setSparkles(prev => prev.filter(s => s.id > Date.now() - 1000));
            }, 1000);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <AnimatePresence>
            {sparkles.map(s => (
                <Sparkle key={s.id} {...s} />
            ))}
        </AnimatePresence>
    );
};
