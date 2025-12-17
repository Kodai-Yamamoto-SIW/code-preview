import { useState, useRef, useCallback, useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { CodePreviewProps, EditorDefinition } from '../types';
import { useSourceCodeStore } from './useSourceCodeStore';
import { useEditorResize } from './useEditorResize';
import { useEditorHeight } from './useEditorHeight';
import { usePreviewHeight } from './usePreviewHeight';
import { useResetHandler } from './useResetHandler';
import { useConsoleLogs } from './useConsoleLogs';
import { useEnsureNewlines } from './useEnsureNewlines';
import { useResizeTargets } from './useResizeTargets';
import { useCodePreviewReset } from './useCodePreviewReset';
import { useEditorConfigs } from './useEditorConfigs';
import { resolveVisibility } from '../utils/visibility';

export const useCodePreview = (props: CodePreviewProps) => {
    const {
        initialHTML,
        initialCSS,
        initialJS,
        minHeight = '200px',
        theme = 'light',
        htmlVisible,
        cssVisible,
        jsVisible,
        previewVisible,
        consoleVisible,
        sourceId,
        htmlPath = 'index.html',
        cssPath,
        jsPath,
        images,
        fileStructureVisible,
    } = props;

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorsRowRef = useRef<HTMLDivElement>(null);
    const htmlEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const cssEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const jsEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // State
    const [showFileStructure, setShowFileStructure] = useState(!!fileStructureVisible);
    const [iframeKey, setIframeKey] = useState(0);
    // iframeIdを一度だけ生成して保持する
    const [iframeId] = useState(() => `iframe-${Math.random().toString(36).substr(2, 9)}`);

    // Store
    const {
        htmlCode, setHtmlCode,
        cssCode, setCssCode,
        jsCode, setJsCode,
        resolvedHTML,
        resolvedCSS,
        resolvedJS,
        resolvedImages,
        resolvedHtmlPath,
        resolvedCssPath,
        resolvedJsPath,
        resetCodes
    } = useSourceCodeStore({
        sourceId,
        initialHTML,
        initialCSS,
        initialJS,
        images,
        htmlPath,
        cssPath,
        jsPath
    });

    const { consoleLogs, setConsoleLogs } = useConsoleLogs(iframeRef, [jsCode, htmlCode]);

    const showHTMLEditor = resolveVisibility(resolvedHTML !== undefined, htmlVisible);
    const showCSSEditor = resolveVisibility(resolvedCSS !== undefined, cssVisible);
    const showJSEditor = resolveVisibility(resolvedJS !== undefined, jsVisible);
    const showPreview = resolveVisibility(showHTMLEditor, previewVisible);
    const showConsole = resolveVisibility(consoleLogs.length > 0, consoleVisible);

    // Editors Definition
    const editors: EditorDefinition[] = useMemo(() => [
        {
            key: 'html',
            label: 'HTML',
            language: 'html',
            code: htmlCode,
            setCode: setHtmlCode,
            visible: showHTMLEditor,
            ref: htmlEditorRef
        },
        {
            key: 'css',
            label: 'CSS',
            language: 'css',
            code: cssCode,
            setCode: setCssCode,
            visible: showCSSEditor,
            ref: cssEditorRef
        },
        {
            key: 'js',
            label: 'JavaScript',
            language: 'javascript',
            code: jsCode,
            setCode: setJsCode,
            visible: showJSEditor,
            ref: jsEditorRef
        }
    ], [htmlCode, cssCode, jsCode, setHtmlCode, setCssCode, setJsCode, showHTMLEditor, showCSSEditor, showJSEditor]);

    // Hooks
    const { editorHeight } = useEditorHeight({
        minHeight,
        editors
    });

    const { previewHeight, updatePreviewHeight } = usePreviewHeight({
        minHeight,
        showPreview,
        iframeRef,
        iframeId,
        editors
    });

    const resizeTargets = useResizeTargets({ editors });

    const {
        sectionWidths,
        isResizing,
        handleMouseDown,
        handleResizerKeyDown,
        updateSectionWidths,
        resetSectionWidthsToAuto
    } = useEditorResize({
        resizeTargets,
        containerRef
    });

    const {
        visibleEditorConfigs,
        showLineNumbers,
        toggleLineNumbers
    } = useEditorConfigs({
        editors,
        updateSectionWidths
    });

    const toggleFileStructure = useCallback(() => {
        setShowFileStructure(prev => !prev);
    }, []);

    const clearConsoleLogs = useCallback(() => {
        setConsoleLogs([]);
    }, [setConsoleLogs]);

    const remountIframe = useCallback(() => {
        setIframeKey(prev => prev + 1);
    }, []);

    // リセット関数
    const handleReset = useCodePreviewReset({
        resetCodes,
        clearConsoleLogs,
        remountIframe,
        updatePreviewHeight
    });

    const {
        resetProgress,
        handleResetMouseDown,
        handleResetMouseUp,
        handleResetMouseLeave
    } = useResetHandler({ onReset: handleReset });

    // 末尾改行保証
    useEnsureNewlines({ editors });

    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    return {
        elementRefs: {
            iframeRef,
            containerRef,
            editorsRowRef,
            htmlEditorRef,
            cssEditorRef,
            jsEditorRef,
        },
        state: {
            htmlCode,
            cssCode,
            jsCode,
            resolvedImages,
            resolvedHtmlPath,
            resolvedCssPath,
            resolvedJsPath,
            consoleLogs,
            showFileStructure,
            iframeKey,
            iframeId,
            editorTheme,
        },
        visibility: {
            showHTMLEditor,
            showCSSEditor,
            showJSEditor,
            showPreview,
            showConsole,
        },
        layout: {
            editorHeight,
            previewHeight,
            sectionWidths,
            isResizing,
            visibleEditorConfigs,
            showLineNumbers,
        },
        handlers: {
            handleMouseDown,
            handleResizerKeyDown,
            resetSectionWidthsToAuto,
            toggleLineNumbers,
            toggleFileStructure,
            handleResetMouseDown,
            handleResetMouseUp,
            handleResetMouseLeave,
            resetProgress,
        }
    };
};
