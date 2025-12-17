import React, { useState, useRef, useCallback } from 'react';
import styles from './styles.module.css';
import { useSourceCodeStore } from './hooks/useSourceCodeStore';
import { useEditorResize } from './hooks/useEditorResize';
import { useEditorHeight } from './hooks/useEditorHeight';
import { usePreviewHeight } from './hooks/usePreviewHeight';
import { useResetHandler } from './hooks/useResetHandler';
import { useConsoleLogs } from './hooks/useConsoleLogs';
import { useEnsureNewlines } from './hooks/useEnsureNewlines';
import { useResizeTargets } from './hooks/useResizeTargets';
import { useCodePreviewReset } from './hooks/useCodePreviewReset';
import { FileStructurePanel } from './components/FileStructurePanel';
import { Toolbar } from './components/Toolbar';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { CodePreviewProps, EditorKey } from './types';
import { useEditorConfigs } from './hooks/useEditorConfigs';
import { resolveVisibility } from './utils/visibility';
import type { editor } from 'monaco-editor';



export default function CodePreview({
    initialHTML,
    initialCSS,
    initialJS,
    title = '',
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
}: CodePreviewProps) {
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
        initialStateRef,
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

    const editorsRowClassName = isResizing ? `${styles.editorsRow} ${styles.isResizing}` : styles.editorsRow;

    const splitLayoutStyle: React.CSSProperties | undefined = showPreview ? undefined : { minHeight: 'auto' };
    const editorsRowStyle: React.CSSProperties | undefined = showPreview || showConsole ? undefined : { borderBottom: 'none' };

    return (
        <div className={styles.codePreviewContainer}>
            {title ? (
                <div className={styles.header}>
                    <h4 className={styles.title}>{title}</h4>
                </div>
            ) : null}

            <div className={styles.splitLayout} ref={containerRef} style={splitLayoutStyle}>
                {/* ファイル構造の表示 */}
                {showFileStructure && (
                    <FileStructurePanel
                        resolvedHtmlPath={resolvedHtmlPath}
                        resolvedCssPath={resolvedCssPath}
                        resolvedJsPath={resolvedJsPath}
                        resolvedImages={resolvedImages}
                    />
                )}

                {/* エディタセクション（上段） */}
                <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
                    <Toolbar
                        resetProgress={resetProgress}
                        showLineNumbers={showLineNumbers}
                        showFileStructure={showFileStructure}
                        onResetMouseDown={handleResetMouseDown}
                        onResetMouseUp={handleResetMouseUp}
                        onResetMouseLeave={handleResetMouseLeave}
                        onToggleLineNumbers={toggleLineNumbers}
                        onToggleFileStructure={toggleFileStructure}
                    />

                    {visibleEditorConfigs.map((config, index) => {
                        const nextConfig = visibleEditorConfigs[index + 1];

                        return (
                            <React.Fragment key={config.key}>
                                <EditorPanel
                                    config={config}
                                    width={sectionWidths[config.key as EditorKey]}
                                    height={editorHeight}
                                    theme={editorTheme}
                                    showLineNumbers={showLineNumbers}
                                />
                                {nextConfig ? (
                                    <div
                                        className={styles.resizer}
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label={`${config.label} と ${nextConfig.label} の幅を調整`}
                                        tabIndex={0}
                                        onMouseDown={event => handleMouseDown(event, config.key as EditorKey, nextConfig.key as EditorKey)}
                                        onKeyDown={event => handleResizerKeyDown(event, config.key as EditorKey, nextConfig.key as EditorKey)}
                                        onDoubleClick={event => {
                                            event.preventDefault();
                                            resetSectionWidthsToAuto();
                                        }}
                                    >
                                        <span className={styles.resizerGrip} />
                                    </div>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* プレビュー（下段） */}
                {/* プレビュー（下段） */}
                {/* 常にレンダリングしてiframeの状態を維持するが、非表示時はdisplay: noneにする */}
                {(showPreview || showHTMLEditor || showCSSEditor || showJSEditor || showConsole) && (
                    <div className={styles.previewSection} style={{ display: showPreview ? 'flex' : 'none' }}>
                        <div className={styles.sectionHeader}>プレビュー</div>
                        <div className={styles.previewContainer}>
                            <PreviewPanel
                                iframeRef={iframeRef}
                                iframeKey={iframeKey}
                                htmlCode={htmlCode}
                                cssCode={cssCode}
                                jsCode={jsCode}
                                showPreview={showPreview}
                                showConsole={showConsole}
                                showHTMLEditor={showHTMLEditor}
                                showJSEditor={showJSEditor}
                                imageBasePath={imageBasePath}
                                resolvedImages={resolvedImages}
                                cssPath={cssPath}
                                jsPath={jsPath}
                                resolvedHtmlPath={resolvedHtmlPath}
                                resolvedCssPath={resolvedCssPath}
                                resolvedJsPath={resolvedJsPath}
                                previewHeight={previewHeight}
                                minHeight={minHeight}
                                visible={true}
                            />
                        </div>
                    </div>
                )}
                {showConsole && (
                    <ConsolePanel logs={consoleLogs} />
                )}
            </div>
        </div>
    );
}
