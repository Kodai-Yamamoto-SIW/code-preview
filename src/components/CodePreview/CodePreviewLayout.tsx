import React from 'react';
import styles from './styles.module.css';
import { FileStructurePanel } from './components/FileStructurePanel';
import { Toolbar } from './components/Toolbar';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { EditorKey } from './types';
import { useCodePreview } from './hooks/useCodePreview';

type UseCodePreviewResult = ReturnType<typeof useCodePreview>;

interface CodePreviewLayoutProps extends UseCodePreviewResult {
    title?: string;
    minHeight: string;
    imageBasePath?: string;
    cssPath?: string;
    jsPath?: string;
}

export const CodePreviewLayout: React.FC<CodePreviewLayoutProps> = ({
    // Props from useCodePreview
    iframeRef,
    containerRef,
    editorsRowRef,
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
    showHTMLEditor,
    showCSSEditor,
    showJSEditor,
    showPreview,
    showConsole,
    editorHeight,
    previewHeight,
    sectionWidths,
    isResizing,
    visibleEditorConfigs,
    showLineNumbers,
    handleMouseDown,
    handleResizerKeyDown,
    resetSectionWidthsToAuto,
    toggleLineNumbers,
    toggleFileStructure,
    handleResetMouseDown,
    handleResetMouseUp,
    handleResetMouseLeave,
    resetProgress,

    // Original props
    title,
    minHeight,
    imageBasePath,
    cssPath,
    jsPath,
}) => {
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
};
