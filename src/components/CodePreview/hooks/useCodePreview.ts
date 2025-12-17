import { useState, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { CodePreviewProps, EditorKey } from '../types';
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
        imageBasePath,
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

    // Hooks
    const { editorHeight } = useEditorHeight({
        minHeight,
        htmlCode,
        cssCode,
        jsCode,
        showHTMLEditor,
        showCSSEditor,
        showJSEditor,
        htmlEditorRef,
        cssEditorRef,
        jsEditorRef
    });

    const { previewHeight, updatePreviewHeight } = usePreviewHeight({
        minHeight,
        showPreview,
        iframeRef,
        htmlCode,
        cssCode,
        jsCode
    });

    const resizeTargets = useResizeTargets({
        showHTMLEditor,
        showCSSEditor,
        showJSEditor,
        htmlEditorRef,
        cssEditorRef,
        jsEditorRef
    });

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
        htmlCode, cssCode, jsCode,
        setHtmlCode, setCssCode, setJsCode,
        showHTMLEditor, showCSSEditor, showJSEditor,
        updateSectionWidths,
        htmlEditorRef, cssEditorRef, jsEditorRef
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
    useEnsureNewlines({
        htmlCode, setHtmlCode, htmlEditorRef, showHTMLEditor,
        cssCode, setCssCode, cssEditorRef, showCSSEditor: showCSSEditor || false,
        jsCode, setJsCode, jsEditorRef, showJSEditor: showJSEditor || false
    });

    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    return {
        refs: {
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
