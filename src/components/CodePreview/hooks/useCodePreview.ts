import { useEffect, useState, useRef, useCallback, useId, useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { ResolvedCodePreviewProps } from '../types';
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
import { useEditorDefinitions } from './useEditorDefinitions';
import { resolveVisibility } from '../utils/visibility';
import { normalizeMinHeight } from '../utils/size-utils';

export const useCodePreview = (props: ResolvedCodePreviewProps) => {
    const {
        initialHTML,
        initialCSS,
        initialJS,
        minHeight,
        theme = 'light',
        htmlVisible,
        cssVisible,
        jsVisible,
        previewVisible,
        consoleVisible,
        sourceId,
        htmlPath,
        cssPath,
        jsPath,
        images,
        fileStructureVisible,
    } = props;
    const defaultHtmlPath = htmlPath ?? 'index.html';

    // Refs
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorsRowRef = useRef<HTMLDivElement>(null);
    const htmlEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const cssEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const jsEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const fileStructureToggledRef = useRef(false);

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
        htmlPath: defaultHtmlPath,
        cssPath,
        jsPath
    });

    const hasFileStructureInputs = !!(
        (resolvedImages && Object.keys(resolvedImages).length > 0) ||
        htmlPath !== undefined ||
        cssPath !== undefined ||
        jsPath !== undefined
    );

    // State
    const [showFileStructure, setShowFileStructure] = useState(() => {
        if (fileStructureVisible !== undefined) {
            return !!fileStructureVisible;
        }
        return hasFileStructureInputs;
    });
    const [iframeKey, setIframeKey] = useState(0);
    const rawIframeId = useId();
    const iframeId = useMemo(() => `iframe-${rawIframeId.replace(/:/g, '')}`, [rawIframeId]);

    const { consoleLogs, setConsoleLogs } = useConsoleLogs(iframeRef, [jsCode, htmlCode]);

    const showHTMLEditor = resolveVisibility(resolvedHTML !== undefined, htmlVisible);
    const showCSSEditor = resolveVisibility(resolvedCSS !== undefined, cssVisible);
    const showJSEditor = resolveVisibility(resolvedJS !== undefined, jsVisible);
    const hasPreviewContent = resolvedHTML !== undefined || showHTMLEditor;
    const showPreview = resolveVisibility(hasPreviewContent, previewVisible);
    const showConsole = resolveVisibility(consoleLogs.length > 0, consoleVisible);

    // Editors Definition
    const editors = useEditorDefinitions({
        htmlCode, setHtmlCode,
        cssCode, setCssCode,
        jsCode, setJsCode,
        showHTMLEditor,
        showCSSEditor,
        showJSEditor,
        htmlEditorRef,
        cssEditorRef,
        jsEditorRef
    });

    const minHeightConfig = normalizeMinHeight(minHeight);

    // Hooks
    const { editorHeight } = useEditorHeight({
        minHeightPx: minHeightConfig.px,
        editors
    });

    const { previewHeight, updatePreviewHeight } = usePreviewHeight({
        minHeightPx: minHeightConfig.px,
        showPreview,
        iframeRef,
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
        fileStructureToggledRef.current = true;
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

    useEffect(() => {
        if (fileStructureVisible !== undefined) {
            setShowFileStructure(!!fileStructureVisible);
            return;
        }
        if (fileStructureToggledRef.current) return;
        if (hasFileStructureInputs) {
            setShowFileStructure(true);
        }
    }, [fileStructureVisible, hasFileStructureInputs]);

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
            minHeightCss: minHeightConfig.css,
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
