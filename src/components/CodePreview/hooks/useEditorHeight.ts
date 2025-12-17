import { useState, useEffect, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { EditorDefinition } from '../types';

/**
 * useEditorHeight フックのプロパティ
 */
interface UseEditorHeightProps {
    minHeight: string;
    editors: EditorDefinition[];
}

/** Monaco Editorの行の高さ (px) */
const EDITOR_LINE_HEIGHT = 19;
/** エディタの垂直パディング (px) */
const EDITOR_VERTICAL_PADDING = 22;
/** エディタの最大高さ (px) */
const MAX_EDITOR_HEIGHT = 600;
/** 高さ更新の遅延時間 (ms) */
const HEIGHT_UPDATE_DELAY_MS = 100;

/**
 * エディタの高さを計算・管理するフック
 */
export const useEditorHeight = ({
    minHeight,
    editors
}: UseEditorHeightProps) => {
    const [editorHeight, setEditorHeight] = useState(minHeight);

    const calculateEditorHeight = useCallback(() => {
        const calculateEditorHeightByCode = (code: string, editorRef?: React.MutableRefObject<editor.IStandaloneCodeEditor | null>): number => {
            // 実際のエディタコンテンツの高さが取得できる場合はそれを使用
            if (editorRef && editorRef.current) {
                const editorInstance = editorRef.current;
                // getContentHeight はコンテンツの高さを返す
                const contentHeight = editorInstance.getContentHeight();
                if (contentHeight > 0) {
                    return contentHeight;
                }
            }

            // エディタがまだマウントされていない場合のヒューリスティック計算
            // minHeightを数値としてパース（"200px" -> 200）
            const minHeightValue = parseInt(minHeight, 10);
            
            if (!code) return minHeightValue;
            
            const lines = code.split('\n').length;
            // 行数 * 行の高さ + パディング で高さを推定
            return Math.max(lines * EDITOR_LINE_HEIGHT + EDITOR_VERTICAL_PADDING, minHeightValue);
        };

        const heights = editors
            .filter(editor => editor.visible)
            .map(editor => calculateEditorHeightByCode(editor.code, editor.ref));

        // 表示されているエディタの中で最大の高さを採用
        const maxEditorHeight = heights.length > 0 ? Math.max(...heights) : 0;
        const minHeightValue = parseInt(minHeight, 10);
        const finalEditorHeight = Math.max(maxEditorHeight, minHeightValue);
        
        // 最大高さ制限を適用
        const limitedEditorHeight = Math.min(finalEditorHeight, MAX_EDITOR_HEIGHT);

        setEditorHeight(limitedEditorHeight + 'px');
    }, [editors, minHeight]);

    const updateEditorHeight = useCallback(() => {
        setTimeout(() => {
            calculateEditorHeight();
        }, HEIGHT_UPDATE_DELAY_MS);
    }, [calculateEditorHeight]);

    useEffect(() => {
        updateEditorHeight();
    }, [updateEditorHeight]);

    useEffect(() => {
        const handleResize = () => {
            updateEditorHeight();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateEditorHeight]);

    return { editorHeight, updateEditorHeight };
};
