import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import styles from './styles.module.css';
import { useSourceCodeStore } from './hooks/useSourceCodeStore';
import { useEditorResize, EditorKey } from './hooks/useEditorResize';
import { useEditorHeight } from './hooks/useEditorHeight';
import { usePreviewHeight } from './hooks/usePreviewHeight';
import { generatePreviewDocument, buildFileStructure } from './utils/previewGenerator';

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

type EditorConfig = {
    key: EditorKey;
    label: string;
    language: 'html' | 'css' | 'javascript';
    value: string;
    onChange: (value: string | undefined) => void;
    onMount: (editor: any) => void;
    visible: boolean;
};

const KEYBOARD_STEP_PERCENT = 5;

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
    const htmlEditorRef = useRef<any>(null);
    const cssEditorRef = useRef<any>(null);
    const jsEditorRef = useRef<any>(null);
    const resetTimerRef = useRef<number | null>(null);
    const resetProgressIntervalRef = useRef<number | null>(null);

    // State
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const [showFileStructure, setShowFileStructure] = useState(!!fileStructureVisible);
    const [iframeKey, setIframeKey] = useState(0);
    const [resetProgress, setResetProgress] = useState(0);

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
        ensureTrailingNewline
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

    const showHTMLEditor = resolveVisibility(resolvedHTML !== undefined, htmlVisible);
    const showCSSEditor = resolveVisibility(resolvedCSS !== undefined, cssVisible);
    const showJSEditor = resolveVisibility(resolvedJS !== undefined, jsVisible);
    const showPreview = resolveVisibility(showHTMLEditor, previewVisible);
    const showConsole = resolveVisibility(consoleLogs.length > 0, consoleVisible);

    // Hooks
    const { editorHeight, updateEditorHeight } = useEditorHeight({
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







    const toggleLineNumbers = () => {
        setShowLineNumbers(prev => !prev);
    };

    // リセット関数
    const handleReset = () => {
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
    };

    // 長押しハンドラー
    const handleResetMouseDown = () => {
        let start = Date.now();
        setResetProgress(0);
        resetProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            setResetProgress(Math.min(elapsed / 500, 1));
        }, 16);
        resetTimerRef.current = window.setTimeout(() => {
            setResetProgress(1);
            handleReset();
            if (resetProgressIntervalRef.current) {
                clearInterval(resetProgressIntervalRef.current);
                resetProgressIntervalRef.current = null;
            }
        }, 500); // 500ミリ秒（0.5秒）の長押し
    };

    const handleResetMouseUp = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current) {
            clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
        setResetProgress(0);
    };

    const handleResetMouseLeave = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current) {
            clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
        setResetProgress(0);
    };

    // コンポーネントのアンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
            }
        };
    }, []);





    useEffect(() => {
        setConsoleLogs([]);
    }, [jsCode, htmlCode]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'codePreviewConsoleLog' && Array.isArray(data.messages)) {
                setConsoleLogs(data.messages);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // HTML末尾改行保証
    useEffect(() => {
        if (!showHTMLEditor) return;
        if (htmlCode && !htmlCode.endsWith('\n')) {
            const newValue = htmlCode + '\n';
            setHtmlCode(newValue);

            if (htmlEditorRef.current) {
                const editor = htmlEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [htmlCode, showHTMLEditor]);

    // CSS末尾改行保証
    useEffect(() => {
        if (cssCode && !cssCode.endsWith('\n')) {
            const newValue = cssCode + '\n';
            setCssCode(newValue);

            if (cssEditorRef.current) {
                const editor = cssEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [cssCode]);

    // JS末尾改行保証
    useEffect(() => {
        if (jsCode && !jsCode.endsWith('\n')) {
            const newValue = jsCode + '\n';
            setJsCode(newValue);

            if (jsEditorRef.current) {
                const editor = jsEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [jsCode]);





    const handleHtmlChange = (value: string | undefined) => setHtmlCode(value || '');
    const handleCssChange = (value: string | undefined) => setCssCode(value || '');
    const handleJsChange = (value: string | undefined) => setJsCode(value || '');

    const handleHtmlEditorDidMount = (editor: any) => {
        htmlEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

    const handleCssEditorDidMount = (editor: any) => {
        cssEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

    const handleJsEditorDidMount = (editor: any) => {
        jsEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

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

    const renderPreviewIframe = (visible: boolean): React.ReactElement => (
        <iframe
            key={`${visible ? 'visible' : 'hidden'}-${iframeKey}`}
            ref={iframeRef}
            srcDoc={generatePreviewDocument({
                htmlCode,
                cssCode,
                jsCode,
                showPreview,
                showConsole,
                showHTMLEditor,
                showJSEditor,
                imageBasePath,
                resolvedImages,
                cssPath,
                jsPath,
                resolvedHtmlPath,
                resolvedCssPath,
                resolvedJsPath
            })}
            className={visible ? styles.preview : undefined}
            title="HTML+CSS Preview"
            sandbox="allow-scripts allow-same-origin"
            style={
                visible
                    ? ({ height: previewHeight, '--min-height': minHeight } as React.CSSProperties)
                    : ({ display: 'none' } as React.CSSProperties)
            }
        />
    );

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
                    <div className={styles.fileStructure}>
                        <div className={styles.fileStructureTitle}>📁 ファイル構造</div>
                        <div className={styles.fileTree}>
                            {(() => {
                                const { folders, rootFiles } = buildFileStructure(resolvedHtmlPath, resolvedCssPath, resolvedJsPath, resolvedImages);
                                return (
                                    <>
                                        {rootFiles.map(file => (
                                            <div key={file} className={styles.fileTreeItem}>
                                                <span className={styles.fileIcon}>📄</span> {file}
                                            </div>
                                        ))}
                                        {Array.from(folders.entries()).map(([folderPath, files]) => (
                                            <div key={folderPath} className={styles.fileTreeFolder}>
                                                <div className={styles.fileTreeItem}>
                                                    <span className={styles.folderIcon}>📁</span> {folderPath}
                                                </div>
                                                {files.map(file => (
                                                    <div key={`${folderPath}/${file}`} className={styles.fileTreeSubItem}>
                                                        <span className={styles.fileIcon}>📄</span> {file}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* エディタセクション（上段） */}
                <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onMouseDown={handleResetMouseDown}
                        onMouseUp={handleResetMouseUp}
                        onMouseLeave={handleResetMouseLeave}
                        onTouchStart={handleResetMouseDown}
                        onTouchEnd={handleResetMouseUp}
                        title="長押しでリセット"
                    >
                        <span
                            className={
                                styles.resetProgressCircle +
                                (resetProgress > 0 ? ' ' + styles.isCharging : '')
                            }
                            aria-hidden="true"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                {/* チャージ進行度（細め・進行時のみ） */}
                                {resetProgress > 0 && (
                                    <circle
                                        cx="12" cy="12" r="10"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 10}
                                        strokeDashoffset={(1 - resetProgress) * 2 * Math.PI * 10}
                                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                                    />
                                )}
                                {/* 中央のリロード（リセット）アイコン */}
                                <g>
                                    <path
                                        d="M12 5a7 7 0 1 1-5.3 2.7"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <polyline
                                        points="6.5,7.5 6.5,4.5 9.5,4.5"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </g>
                            </svg>
                        </span>
                        <span className={styles.hiddenText}>長押しでリセット</span>
                    </button>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onClick={toggleLineNumbers}
                        aria-pressed={showLineNumbers}
                        title={showLineNumbers ? '行番号を隠す' : '行番号を表示'}
                    >
                        <span aria-hidden="true">#</span>
                        <span className={styles.hiddenText}>{showLineNumbers ? '行番号を隠す' : '行番号を表示'}</span>
                    </button>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onClick={() => setShowFileStructure(prev => !prev)}
                        aria-pressed={showFileStructure}
                        title={showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}
                    >
                        <span aria-hidden="true">📁</span>
                        <span className={styles.hiddenText}>{showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}</span>
                    </button>

                    {visibleEditorConfigs.map((config, index) => {
                        const nextConfig = visibleEditorConfigs[index + 1];

                        return (
                            <React.Fragment key={config.key}>
                                <div className={styles.editorSection} style={{ width: `${sectionWidths[config.key]}%` }}>
                                    <div className={styles.sectionHeader}>{config.label}</div>
                                    <div className={styles.editorContainer}>
                                        <Editor
                                            height={editorHeight}
                                            defaultLanguage={config.language}
                                            value={config.value}
                                            onChange={config.onChange}
                                            onMount={config.onMount}
                                            theme={editorTheme}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                lineNumbers: showLineNumbers ? 'on' : 'off',
                                                folding: false,
                                                padding: { top: 5, bottom: 5 },
                                                roundedSelection: false,
                                                wordWrap: 'off',
                                                tabSize: 2,
                                                insertSpaces: true,
                                                scrollBeyondLastLine: false,
                                            }}
                                        />
                                    </div>
                                </div>
                                {nextConfig ? (
                                    <div
                                        className={styles.resizer}
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label={`${config.label} と ${nextConfig.label} の幅を調整`}
                                        tabIndex={0}
                                        onMouseDown={event => handleMouseDown(event, config.key, nextConfig.key)}
                                        onKeyDown={event => handleResizerKeyDown(event, config.key, nextConfig.key)}
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
                            {renderPreviewIframe(true)}
                        </div>
                    </div>
                ) : (
                    (showHTMLEditor || showCSSEditor || showJSEditor || showConsole) && (
                        <div style={{ display: 'none' }}>{renderPreviewIframe(false)}</div>
                    )
                )}
                {showConsole && (
                    <div className={styles.consoleSection}>
                        <div className={styles.sectionHeader}>コンソール</div>
                        <div className={styles.consoleContainer}>
                            {consoleLogs.length === 0 ? (
                                <div className={styles.consolePlaceholder}>ここに console.log の結果が表示されます</div>
                            ) : (
                                consoleLogs.map((log, index) => (
                                    <div key={index} className={styles.consoleLine}>
                                        <span className={styles.consoleBullet}>▶</span>
                                        <span>{log}</span>
                                    </div>
                                ))
                            )
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
