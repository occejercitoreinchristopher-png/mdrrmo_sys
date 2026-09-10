import React, { createContext, useState, useRef, useEffect } from 'react';

export const AlarmContext = createContext<any>({
    activeAlarm: null,
    triggerAlarm: (incident: any) => {},
    acknowledgeAlarm: () => {},
});

export const AlarmProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeAlarm, setActiveAlarm] = useState<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const playBeep = () => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
            osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6 note
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error("Audio playback blocked or failed:", e);
        }
    };

    const triggerAlarm = (incident: any) => {
        // Prevent triggering multiple identical alarms
        setActiveAlarm((prev: any) => {
            if (prev && prev.id === incident.id) return prev;
            
            // Start audio sequence
            playBeep();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(playBeep, 1500);
            
            return incident;
        });
    };

    const acknowledgeAlarm = () => {
        setActiveAlarm(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        };
    }, []);

    return (
        <AlarmContext.Provider value={{ activeAlarm, triggerAlarm, acknowledgeAlarm }}>
            {children}
        </AlarmContext.Provider>
    );
};
