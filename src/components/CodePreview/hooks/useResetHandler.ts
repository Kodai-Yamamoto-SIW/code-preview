import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useResetHandler フックのプロパティ
 */
interface UseResetHandlerProps {
    /** リセット確定時に実行されるコールバック */
    onReset: () => void;
    /** 長押しと判定されるまでの時間 (ms) */
    longPressDuration?: number;
}

/** プログレスバーの更新間隔 (ms) */
const PROGRESS_UPDATE_INTERVAL_MS = 16;

/**
 * リセットボタンの長押し操作を管理するフック
 */
export const useResetHandler = ({ onReset, longPressDuration = 500 }: UseResetHandlerProps) => {
    const [resetProgress, setResetProgress] = useState(0);
    const resetTimerRef = useRef<number | null>(null);
    const resetProgressIntervalRef = useRef<number | null>(null);

    /**
     * タイマーとインターバルをクリアする
     */
    const clearTimers = useCallback(() => {
        if (resetTimerRef.current !== null) {
            window.clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current !== null) {
            window.clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
    }, []);

    /**
     * マウスダウン時の処理
     * 長押しタイマーとプログレスバーのアニメーションを開始する
     */
    const handleResetMouseDown = useCallback(() => {
        const startTime = Date.now();
        setResetProgress(0);
        
        // プログレスバーの更新
        resetProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            // 1を超えないように制限
            const progress = Math.min(elapsed / longPressDuration, 1);
            setResetProgress(progress);
        }, PROGRESS_UPDATE_INTERVAL_MS);

        // 長押し完了時の処理
        resetTimerRef.current = window.setTimeout(() => {
            setResetProgress(1);
            onReset();
            // 完了したらインターバルを止める
            if (resetProgressIntervalRef.current !== null) {
                window.clearInterval(resetProgressIntervalRef.current);
                resetProgressIntervalRef.current = null;
            }
        }, longPressDuration);
    }, [onReset, longPressDuration]);

    /**
     * マウスアップ時の処理
     * タイマーをキャンセルし、プログレスをリセットする
     */
    const handleResetMouseUp = useCallback(() => {
        clearTimers();
        setResetProgress(0);
    }, [clearTimers]);

    /**
     * マウスリーブ時の処理
     * マウスアップと同様にキャンセル扱いとする
     */
    const handleResetMouseLeave = useCallback(() => {
        clearTimers();
        setResetProgress(0);
    }, [clearTimers]);

    // コンポーネントのアンマウント時にタイマーをクリーンアップ
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
