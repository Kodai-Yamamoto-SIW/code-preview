import { useCallback, useState, MutableRefObject, useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { EditorConfig } from '../types';

/**
 * useEditorConfigs フックのプロパティ
 */
interface UseEditorConfigsProps {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    setHtmlCode: (value: string) => void;
    setCssCode: (value: string) => void;
    setJsCode: (value: string) => void;
    showHTMLEditor: boolean;
    showCSSEditor: boolean;
    showJSEditor: boolean;
    updateSectionWidths: (force?: boolean) => void;
    htmlEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
    cssEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
    jsEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
}

/** レイアウト更新の遅延時間 (ms) */
const LAYOUT_UPDATE_DELAY_MS = 100;
/** コンテンツ変更時のレイアウト更新遅延時間 (ms) */
const CONTENT_CHANGE_LAYOUT_DELAY_MS = 50;

/**
 * エディタの設定とイベントハンドラを管理するフック
 */
export const useEditorConfigs = ({
    htmlCode, cssCode, jsCode,
    setHtmlCode, setCssCode, setJsCode,
    showHTMLEditor, showCSSEditor, showJSEditor,
    updateSectionWidths,
    htmlEditorRef, cssEditorRef, jsEditorRef
}: UseEditorConfigsProps) => {
    // 行番号表示の状態
    const [showLineNumbers, setShowLineNumbers] = useState(false);

    const toggleLineNumbers = useCallback(() => {
        setShowLineNumbers(prev => !prev);
    }, []);

    // 変更ハンドラ
    const handleHtmlChange = useCallback((value: string | undefined) => setHtmlCode(value || ''), [setHtmlCode]);
    const handleCssChange = useCallback((value: string | undefined) => setCssCode(value || ''), [setCssCode]);
    const handleJsChange = useCallback((value: string | undefined) => setJsCode(value || ''), [setJsCode]);

    // マウントハンドラの作成
    const createMountHandler = useCallback((ref: MutableRefObject<editor.IStandaloneCodeEditor | null>) => {
        return (editorInstance: editor.IStandaloneCodeEditor) => {
            ref.current = editorInstance;
            // 初期表示時のレイアウト調整
            setTimeout(() => updateSectionWidths(), LAYOUT_UPDATE_DELAY_MS);
            // コンテンツ変更時にレイアウトを再計算
            editorInstance.onDidChangeModelContent(() => setTimeout(() => updateSectionWidths(), CONTENT_CHANGE_LAYOUT_DELAY_MS));
        };
    }, [updateSectionWidths]);

    const handleHtmlEditorDidMount = useMemo(() => createMountHandler(htmlEditorRef), [createMountHandler, htmlEditorRef]);
    const handleCssEditorDidMount = useMemo(() => createMountHandler(cssEditorRef), [createMountHandler, cssEditorRef]);
    const handleJsEditorDidMount = useMemo(() => createMountHandler(jsEditorRef), [createMountHandler, jsEditorRef]);

    // 設定の生成
    const editorConfigs: EditorConfig[] = [
        {
            key: 'html',
            label: 'HTML',
            language: 'html',
            value: htmlCode,
            onChange: handleHtmlChange,
            onMount: handleHtmlEditorDidMount,
            visible: showHTMLEditor,
        },
        {
            key: 'css',
            label: 'CSS',
            language: 'css',
            value: cssCode,
            onChange: handleCssChange,
            onMount: handleCssEditorDidMount,
            visible: showCSSEditor,
        },
        {
            key: 'js',
            label: 'JavaScript',
            language: 'javascript',
            value: jsCode,
            onChange: handleJsChange,
            onMount: handleJsEditorDidMount,
            visible: showJSEditor,
        },
    ];

    const visibleEditorConfigs = editorConfigs.filter(config => config.visible);

    return {
        htmlEditorRef,
        cssEditorRef,
        jsEditorRef,
        editorConfigs,
        visibleEditorConfigs,
        showLineNumbers,
        toggleLineNumbers,
        setShowLineNumbers
    };
};
