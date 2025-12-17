import { useCallback } from 'react';

interface UseCodePreviewResetProps {
    resetCodes: () => void;
    setConsoleLogs: (logs: any[]) => void;
    setIframeKey: (updater: (prev: number) => number) => void;
    updatePreviewHeight: () => void;
}

export const useCodePreviewReset = ({
    resetCodes,
    setConsoleLogs,
    setIframeKey,
    updatePreviewHeight
}: UseCodePreviewResetProps) => {
    return useCallback(() => {
        // 編集したコードを初期状態に戻す
        resetCodes();

        // コンソールログをクリア
        setConsoleLogs([]);

        // iframeを強制的に再マウント
        setIframeKey(prev => prev + 1);

        // プレビューを再レンダリング
        setTimeout(() => {
            updatePreviewHeight();
        }, 100);
    }, [resetCodes, setConsoleLogs, setIframeKey, updatePreviewHeight]);
};
