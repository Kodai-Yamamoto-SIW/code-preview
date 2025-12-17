import { useCallback, useState, useMemo } from 'react';
import { EditorConfig, EditorDefinition } from '../types';
import { useEditorMount } from './useEditorMount';

interface UseEditorConfigsProps {
    editors: EditorDefinition[];
    updateSectionWidths: (force?: boolean) => void;
}

/**
 * エディタの設定とイベントハンドラを管理するフック
 */
export const useEditorConfigs = ({
    editors,
    updateSectionWidths,
}: UseEditorConfigsProps) => {
    // 行番号表示の状態
    const [showLineNumbers, setShowLineNumbers] = useState(false);

    const toggleLineNumbers = useCallback(() => {
        setShowLineNumbers(prev => !prev);
    }, []);

    // マウントハンドラの作成
    const { createMountHandler } = useEditorMount(updateSectionWidths);

    // 設定の生成
    const visibleEditorConfigs: EditorConfig[] = useMemo(() => {
        return editors
            .filter(editor => editor.visible)
            .map(editor => ({
                key: editor.key,
                label: editor.label,
                language: editor.language,
                value: editor.code,
                onChange: (value: string | undefined) => editor.setCode(value || ''),
                onMount: createMountHandler(editor.ref),
                visible: true,
            }));
    }, [editors, createMountHandler]);

    return {
        visibleEditorConfigs,
        showLineNumbers,
        toggleLineNumbers
    };
};
