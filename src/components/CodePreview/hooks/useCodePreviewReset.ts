import { useCallback } from 'react';

/**
 * useCodePreviewReset フックのプロパティ
 */
interface UseCodePreviewResetProps {
    /** コードを初期状態に戻す関数 */
    resetCodes: () => void;
    /** コンソールログを設定する関数 */
    setConsoleLogs: (logs: string[]) => void;
    /** iframeのキーを更新して再マウントをトリガーする関数 */
    setIframeKey: (updater: (prev: number) => number) => void;
    /** プレビューの高さを更新する関数 */
    updatePreviewHeight: () => void;
}

/** プレビューの高さ更新までの遅延時間 (ms) */
const PREVIEW_UPDATE_DELAY_MS = 100;

/**
 * コードプレビューのリセット処理を提供するフック
 */
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
        // iframeの再マウントとレンダリング完了を待つために遅延させる
        setTimeout(() => {
            updatePreviewHeight();
        }, PREVIEW_UPDATE_DELAY_MS);
    }, [resetCodes, setConsoleLogs, setIframeKey, updatePreviewHeight]);
};
