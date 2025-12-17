import { useCallback, useState, MutableRefObject, useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { EditorConfig } from '../types';

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

export const useEditorConfigs = ({
    htmlCode, cssCode, jsCode,
    setHtmlCode, setCssCode, setJsCode,
    showHTMLEditor, showCSSEditor, showJSEditor,
    updateSectionWidths,
    htmlEditorRef, cssEditorRef, jsEditorRef
}: UseEditorConfigsProps) => {
    // State for line numbers
    const [showLineNumbers, setShowLineNumbers] = useState(false);

    const toggleLineNumbers = useCallback(() => {
        setShowLineNumbers(prev => !prev);
    }, []);

    // Change handlers
    const handleHtmlChange = useCallback((value: string | undefined) => setHtmlCode(value || ''), [setHtmlCode]);
    const handleCssChange = useCallback((value: string | undefined) => setCssCode(value || ''), [setCssCode]);
    const handleJsChange = useCallback((value: string | undefined) => setJsCode(value || ''), [setJsCode]);

    // Mount handlers
    const createMountHandler = useCallback((ref: MutableRefObject<editor.IStandaloneCodeEditor | null>) => {
        return (editorInstance: editor.IStandaloneCodeEditor) => {
            ref.current = editorInstance;
            setTimeout(() => updateSectionWidths(), 100);
            editorInstance.onDidChangeModelContent(() => setTimeout(() => updateSectionWidths(), 50));
        };
    }, [updateSectionWidths]);

    const handleHtmlEditorDidMount = useMemo(() => createMountHandler(htmlEditorRef), [createMountHandler, htmlEditorRef]);
    const handleCssEditorDidMount = useMemo(() => createMountHandler(cssEditorRef), [createMountHandler, cssEditorRef]);
    const handleJsEditorDidMount = useMemo(() => createMountHandler(jsEditorRef), [createMountHandler, jsEditorRef]);

    // Generate configs
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
