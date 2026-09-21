import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';

export interface AlarmContextType {
    activeAlarm: any;
    isPlaying: boolean;
    triggerAlarm: (incident: any) => void;
    acknowledgeAlarm: () => void;
    testAlarm: () => void;
    stopSound: () => void;
}

export const AlarmContext = createContext<AlarmContextType>({
    activeAlarm: null,
    isPlaying: false,
    triggerAlarm: () => {},
    acknowledgeAlarm: () => {},
    testAlarm: () => {},
    stopSound: () => {},
});

export const AlarmProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeAlarm, setActiveAlarm] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const isAudioSetupRef = useRef<boolean>(false);
    const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Web Audio Graph to amplify sound beyond standard 1.0 volume
    const initAudioGraph = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            if (!audioRef.current) {
                const audio = new Audio('/sounds/dispatcher_alarm.mp3');
                audio.loop = true;
                audio.preload = 'auto';
                audioRef.current = audio;
            }

            if (!audioCtxRef.current) {
                const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtxClass) {
                    audioCtxRef.current = new AudioCtxClass();
                }
            }

            const ctx = audioCtxRef.current;
            if (ctx && audioRef.current && !isAudioSetupRef.current) {
                try {
                    const source = ctx.createMediaElementSource(audioRef.current);
                    
                    // Dynamics Compressor to prevent harsh digital clipping at amplified volume
                    const compressor = ctx.createDynamicsCompressor();
                    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
                    compressor.knee.setValueAtTime(8, ctx.currentTime);
                    compressor.ratio.setValueAtTime(10, ctx.currentTime);
                    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
                    compressor.release.setValueAtTime(0.25, ctx.currentTime);

                    // Gain booster for maximum loudness (1.8x gain)
                    const gainNode = ctx.createGain();
                    gainNode.gain.setValueAtTime(1.8, ctx.currentTime);

                    source.connect(compressor);
                    compressor.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    isAudioSetupRef.current = true;
                } catch (graphErr) {
                    console.warn('Audio graph connection fallback:', graphErr);
                }
            }

            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        } catch (e) {
            console.error('Failed to init audio graph:', e);
        }
    }, []);

    // Loud synthetic fallback tone if audio file is inaccessible
    const playFallbackSynthTone = useCallback(() => {
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(960, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.35);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.8, ctx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.36);
        } catch (e) {
            console.error('Fallback audio playback failed:', e);
        }
    }, []);

    const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startSound = useCallback(() => {
        initAudioGraph();

        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }

        setIsPlaying(true);

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1.0;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('Audio play blocked or waiting for user interaction:', err);
                    playFallbackSynthTone();
                    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
                    fallbackIntervalRef.current = setInterval(playFallbackSynthTone, 650);
                });
            }
        } else {
            playFallbackSynthTone();
            if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = setInterval(playFallbackSynthTone, 650);
        }
    }, [initAudioGraph, playFallbackSynthTone]);

    const stopSound = useCallback(() => {
        setIsPlaying(false);
        if (testTimeoutRef.current) {
            clearTimeout(testTimeoutRef.current);
            testTimeoutRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
            fallbackIntervalRef.current = null;
        }
    }, []);

    const triggerAlarm = useCallback((incident: any) => {
        // Prevent triggering multiple identical alarms
        setActiveAlarm((prev: any) => {
            if (prev && prev.id === incident.id) return prev;
            startSound();
            return incident;
        });
    }, [startSound]);

    const acknowledgeAlarm = useCallback(() => {
        setActiveAlarm(null);
        stopSound();
    }, [stopSound]);

    const testAlarm = useCallback(() => {
        if (isPlaying) {
            stopSound();
            return;
        }
        startSound();
        if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
        testTimeoutRef.current = setTimeout(() => {
            stopSound();
        }, 5200);
    }, [isPlaying, startSound, stopSound]);

    // Preload audio and unlock AudioContext on user interaction
    useEffect(() => {
        const unlockAudio = () => {
            initAudioGraph();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });

        return () => {
            stopSound();
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
            }
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, [initAudioGraph, stopSound]);

    return (
        <AlarmContext.Provider value={{ activeAlarm, isPlaying, triggerAlarm, acknowledgeAlarm, testAlarm, stopSound }}>
            {children}
        </AlarmContext.Provider>
    );
};

