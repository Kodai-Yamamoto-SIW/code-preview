import { useCallback, MutableRefObject } from 'react';
import type { editor } from 'monaco-editor';

/** レイアウト更新の遅延時間 (ms) */
const LAYOUT_UPDATE_DELAY_MS = 100;
/** コンテンツ変更時のレイアウト更新遅延時間 (ms) */
const CONTENT_CHANGE_LAYOUT_DELAY_MS = 50;

export const useEditorMount = (
    updateSectionWidths: (force?: boolean) => void
) => {
    const createMountHandler = useCallback((ref: MutableRefObject<editor.IStandaloneCodeEditor | null>) => {
        return (editorInstance: editor.IStandaloneCodeEditor) => {
            ref.current = editorInstance;
            // 初期表示時のレイアウト調整
            setTimeout(() => updateSectionWidths(), LAYOUT_UPDATE_DELAY_MS);
            // コンテンツ変更時にレイアウトを再計算
            editorInstance.onDidChangeModelContent(() => setTimeout(() => updateSectionWidths(), CONTENT_CHANGE_LAYOUT_DELAY_MS));
        };
    }, [updateSectionWidths]);

    return { createMountHandler };
};
