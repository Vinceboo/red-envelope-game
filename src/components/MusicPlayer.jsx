import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Music4, ListMusic, Play, Loader } from 'lucide-react';

export const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Explicit Playlist configuration
    const playlist = [
        { title: "Gong Xi Fa Cai", src: "/bgm.mp3" },
        { title: "Joyful New Year", src: "/bgm2.mp3" }
    ];

    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    // Initial auto-play logic
    useEffect(() => {
        const startAudio = () => {
            if (audioRef.current && !isPlaying) {
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.log("Audio autoplay blocked", e));
            }
            window.removeEventListener('click', startAudio);
            window.removeEventListener('touchstart', startAudio);
        };

        window.addEventListener('click', startAudio);
        window.addEventListener('touchstart', startAudio);

        return () => {
            window.removeEventListener('click', startAudio);
            window.removeEventListener('touchstart', startAudio);
        };
    }, []);

    // Handle track changes
    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play()
                .catch(e => console.log("Playback failed on track change", e));
        }
    }, [currentTrackIndex]);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const playTrack = (index) => {
        setCurrentTrackIndex(index);
        if (!isPlaying) setIsPlaying(true);
        setIsMenuOpen(false); // Close menu after selection
    };

    const handleEnded = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
            <audio
                ref={audioRef}
                src={playlist[currentTrackIndex].src}
                onEnded={handleEnded}
            />

            <div className="flex items-center gap-2">
                {/* Playlist Menu Toggle */}
                <motion.button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 ${isMenuOpen ? 'bg-white text-black' : 'bg-black/20 text-white/70'}`}
                >
                    <ListMusic size={14} />
                </motion.button>

                {/* Play/Pause Button */}
                <motion.button
                    onClick={togglePlay}
                    animate={isPlaying ? { rotate: 360 } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/20 shadow-lg backdrop-blur-md transition-colors ${isPlaying ? 'bg-[var(--color-ios-gold)] text-red-600' : 'bg-white/10 text-white/60'
                        }`}
                >
                    {isPlaying ? <Music size={20} /> : <Music4 size={20} />}
                </motion.button>
            </div>

            {/* Playlist Popup Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-12 right-0 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 overflow-hidden"
                    >
                        <div className="px-2 py-1 text-xs text-white/40 font-medium uppercase tracking-wider border-b border-white/10 mb-1">
                            Select Music
                        </div>
                        {playlist.map((track, i) => (
                            <button
                                key={track.src}
                                onClick={(e) => { e.stopPropagation(); playTrack(i); }}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${currentTrackIndex === i
                                        ? 'bg-[var(--color-ios-gold)] text-black font-bold'
                                        : 'hover:bg-white/10 text-white/80'
                                    }`}
                            >
                                {currentTrackIndex === i && isPlaying ? (
                                    <Loader className="animate-spin" size={12} /> // Playing indicator
                                ) : (
                                    <span className="w-3 h-3 rounded-full border border-current opacity-50" />
                                )}
                                <span className="truncate">{track.title}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
