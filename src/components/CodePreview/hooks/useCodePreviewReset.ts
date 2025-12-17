import { useCallback } from 'react';

/**
 * useCodePreviewReset フックのプロパティ
 */
interface UseCodePreviewResetProps {
    /** コードを初期状態に戻す関数 */
    resetCodes: () => void;
    /** コンソールログをクリアする関数 */
    clearConsoleLogs: () => void;
    /** iframeを再マウントする関数 */
    remountIframe: () => void;
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
    clearConsoleLogs,
    remountIframe,
    updatePreviewHeight
}: UseCodePreviewResetProps) => {
    return useCallback(() => {
        // 編集したコードを初期状態に戻す
        resetCodes();

        // コンソールログをクリア
        clearConsoleLogs();

        // iframeを強制的に再マウント
        remountIframe();

        // プレビューを再レンダリング
        // iframeの再マウントとレンダリング完了を待つために遅延させる
        setTimeout(() => {
            updatePreviewHeight();
        }, PREVIEW_UPDATE_DELAY_MS);
    }, [resetCodes, clearConsoleLogs, remountIframe, updatePreviewHeight]);
};
