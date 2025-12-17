import { useState, useRef, useEffect, useCallback } from 'react';

interface UseResetHandlerProps {
    onReset: () => void;
    longPressDuration?: number;
}

export const useResetHandler = ({ onReset, longPressDuration = 500 }: UseResetHandlerProps) => {
    const [resetProgress, setResetProgress] = useState(0);
    const resetTimerRef = useRef<number | null>(null);
    const resetProgressIntervalRef = useRef<number | null>(null);

    const clearTimers = useCallback(() => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current) {
            clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
    }, []);

    const handleResetMouseDown = useCallback(() => {
        let start = Date.now();
        setResetProgress(0);
        
        resetProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            setResetProgress(Math.min(elapsed / longPressDuration, 1));
        }, 16);

        resetTimerRef.current = window.setTimeout(() => {
            setResetProgress(1);
            onReset();
            if (resetProgressIntervalRef.current) {
                clearInterval(resetProgressIntervalRef.current);
                resetProgressIntervalRef.current = null;
            }
        }, longPressDuration);
    }, [onReset, longPressDuration]);

    const handleResetMouseUp = useCallback(() => {
        clearTimers();
        setResetProgress(0);
    }, [clearTimers]);

    const handleResetMouseLeave = useCallback(() => {
        clearTimers();
        setResetProgress(0);
    }, [clearTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimers();
        };
    }, [clearTimers]);

    return {
        resetProgress,
        handleResetMouseDown,
        handleResetMouseUp,
        handleResetMouseLeave
    };
};
