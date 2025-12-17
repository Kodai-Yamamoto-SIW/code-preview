import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './styles.module.css';
import { useSourceCodeStore } from './hooks/useSourceCodeStore';
import { useEditorResize, EditorKey } from './hooks/useEditorResize';
import { useEditorHeight } from './hooks/useEditorHeight';
import { usePreviewHeight } from './hooks/usePreviewHeight';
import { useResetHandler } from './hooks/useResetHandler';
import { useConsoleLogs } from './hooks/useConsoleLogs';
import { useEnsureNewline } from './hooks/useEnsureNewline';
import { FileStructurePanel } from './components/FileStructurePanel';
import { Toolbar } from './components/Toolbar';
import { EditorPanel, EditorConfig } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ConsolePanel } from './components/ConsolePanel';
import type { editor } from 'monaco-editor';

export interface CodePreviewProps {
    /**
     * ファイル構造（エクスプローラ）の初期表示状態
     * trueで初期表示、falseで非表示
     */
    fileStructureVisible?: boolean;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    title?: string;
    minHeight?: string;
    imageBasePath?: string;
    /**
     * エディタのテーマ。Docusaurusがない環境でも動くよう、明示的に指定できます。
     * 省略時は 'light'
     */
    theme?: 'light' | 'dark';
    htmlVisible?: boolean;
    cssVisible?: boolean;
    jsVisible?: boolean;
    previewVisible?: boolean;
    consoleVisible?: boolean;
    /**
     * 同じコードを持つ複数の CodePreview を簡単に設置するためのID。
     * 同じ sourceId を持つ CodePreview が複数ある場合、最初のインスタンスの
     * initialHTML/CSS/JS が2つ目以降でも自動的に使われます。
     */
    sourceId?: string;
    /**
     * HTMLファイルのパス（例: "index.html"）
     * デフォルト: "index.html"
     */
    htmlPath?: string;
    /**
     * CSSファイルのパス（例: "css/style.css"）
     * 指定された場合、HTML内で相対パスで参照可能になります
     */
    cssPath?: string;
    /**
     * JavaScriptファイルのパス（例: "js/script.js"）
     * 指定された場合、HTML内で相対パスで参照可能になります
     */
    jsPath?: string;
    /**
     * 画像ファイルのパスとURLのマップ（Docusaurusのstatic/img/〜など）
     * 例: { "img/sample.png": "/img/sample.png" }
     */
    images?: { [path: string]: string };
}

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
    const [showLineNumbers, setShowLineNumbers] = useState(false);
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

    // Visibility Logic
    const resolveVisibility = (autoVisible: boolean, override?: boolean): boolean => {
        if (typeof override === 'boolean') {
            return override;
        }
        return autoVisible;
    };

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

    const {
        sectionWidths,
        isResizing,
        handleMouseDown,
        handleResizerKeyDown,
        updateSectionWidths,
        resetSectionWidthsToAuto
    } = useEditorResize({
        showHTMLEditor,
        showCSSEditor,
        showJSEditor,
        containerRef,
        htmlEditorRef,
        cssEditorRef,
        jsEditorRef
    });

    const toggleLineNumbers = useCallback(() => {
        setShowLineNumbers(prev => !prev);
    }, []);

    const toggleFileStructure = useCallback(() => {
        setShowFileStructure(prev => !prev);
    }, []);

    // リセット関数
    const handleReset = useCallback(() => {
        // 編集したコードを初期状態に戻す
        setHtmlCode(initialStateRef.current.html);
        setCssCode(initialStateRef.current.css);
        setJsCode(initialStateRef.current.js);

        // コンソールログをクリア
        setConsoleLogs([]);

        // iframeを強制的に再マウント
        setIframeKey(prev => prev + 1);

        // プレビューを再レンダリング
        setTimeout(() => {
            updatePreviewHeight();
        }, 100);
    }, [initialStateRef, setHtmlCode, setCssCode, setJsCode, setConsoleLogs, updatePreviewHeight]);

    const {
        resetProgress,
        handleResetMouseDown,
        handleResetMouseUp,
        handleResetMouseLeave
    } = useResetHandler({ onReset: handleReset });

    // 末尾改行保証
    useEnsureNewline(htmlCode, setHtmlCode, htmlEditorRef, showHTMLEditor);
    useEnsureNewline(cssCode, setCssCode, cssEditorRef, showCSSEditor || false);
    useEnsureNewline(jsCode, setJsCode, jsEditorRef, showJSEditor || false);

    const handleHtmlChange = useCallback((value: string | undefined) => setHtmlCode(value || ''), [setHtmlCode]);
    const handleCssChange = useCallback((value: string | undefined) => setCssCode(value || ''), [setCssCode]);
    const handleJsChange = useCallback((value: string | undefined) => setJsCode(value || ''), [setJsCode]);

    const handleHtmlEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
        htmlEditorRef.current = editorInstance;
        setTimeout(updateSectionWidths, 100);
        editorInstance.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    }, [updateSectionWidths]);

    const handleCssEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
        cssEditorRef.current = editorInstance;
        setTimeout(updateSectionWidths, 100);
        editorInstance.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    }, [updateSectionWidths]);

    const handleJsEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
        jsEditorRef.current = editorInstance;
        setTimeout(updateSectionWidths, 100);
        editorInstance.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    }, [updateSectionWidths]);

    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

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
                {showPreview ? (
                    <div className={styles.previewSection}>
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
                ) : (
                    (showHTMLEditor || showCSSEditor || showJSEditor || showConsole) && (
                        <div style={{ display: 'none' }}>
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
                                visible={false}
                            />
                        </div>
                    )
                )}
                {showConsole && (
                    <ConsolePanel logs={consoleLogs} />
                )}
            </div>
        </div>
    );
}
