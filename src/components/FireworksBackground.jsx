import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Individual Firework Particle
const Particle = ({ color, x, y }) => {
    // Random angle and distance for explosion
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 100 + 50; // Larger explosion radius
    const endX = Math.cos(angle) * velocity;
    const endY = Math.sin(angle) * velocity;

    return (
        <motion.div
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{
                x: endX,
                y: endY,
                opacity: 0,
                scale: [0, 1, 0], // Flash effect
            }}
            transition={{ duration: 1 + Math.random(), ease: "easeOut" }} // Slow fade
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: '6px', // Larger particles
                height: '6px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}`,
            }}
        />
    );
};

// A single Firework explosion
const Firework = ({ id, onComplete }) => {
    // Random position (avoiding very edges)
    const x = Math.random() * 80 + 10 + '%';
    const y = Math.random() * 60 + 10 + '%';

    // Random vibrant color
    const colors = ['#FFD60A', '#FF3B30', '#34C759', '#32ADE6', '#AF52DE', '#FF9500'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Number of particles per explosion
    const particles = Array.from({ length: 24 }); // More particles

    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
            {particles.map((_, i) => (
                <Particle key={i} color={color} x={0} y={0} />
            ))}
        </div>
    );
};

export const FireworksBackground = () => {
    const [fireworks, setFireworks] = useState([]);

    useEffect(() => {
        // Spawn a firework every few seconds
        const spawnInterval = setInterval(() => {
            setFireworks(prev => {
                // Limit max concurrent fireworks
                if (prev.length > 8) return prev;
                return [...prev, { id: Date.now() }];
            });
        }, 800); // More frequent (0.8s)

        return () => clearInterval(spawnInterval);
    }, []);

    const removeFirework = (id) => {
        setFireworks(prev => prev.filter(fw => fw.id !== id));
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
            <AnimatePresence>
                {fireworks.map(fw => (
                    <Firework key={fw.id} id={fw.id} onComplete={() => removeFirework(fw.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
};
