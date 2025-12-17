import React from 'react';
import styles from './styles.module.css';
import { FileStructurePanel } from './components/FileStructurePanel';
import { Toolbar } from './components/Toolbar';
import { EditorPanel } from './components/EditorPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { EditorKey } from './types';
import { useCodePreview } from './hooks/useCodePreview';

import type { editor } from 'monaco-editor';

type UseCodePreviewResult = ReturnType<typeof useCodePreview>;

interface CodePreviewLayoutProps extends UseCodePreviewResult {
    title?: string;
    minHeight: string;
    imageBasePath?: string;
    cssPath?: string;
    jsPath?: string;
    editorOptions?: editor.IEditorConstructionOptions;
}

export const CodePreviewLayout: React.FC<CodePreviewLayoutProps> = ({
    elementRefs,
    state,
    visibility,
    layout,
    handlers,
    title,
    minHeight,
    imageBasePath,
    cssPath,
    jsPath,
    editorOptions,
}) => {
    const {
        iframeRef,
        containerRef,
        editorsRowRef,
    } = elementRefs;

    const editorsRowClassName = layout.isResizing ? `${styles.editorsRow} ${styles.isResizing}` : styles.editorsRow;
    const splitLayoutStyle: React.CSSProperties | undefined = visibility.showPreview ? undefined : { minHeight: 'auto' };
    const editorsRowStyle: React.CSSProperties | undefined = visibility.showPreview || visibility.showConsole ? undefined : { borderBottom: 'none' };

    return (
        <div className={styles.codePreviewContainer}>
            {title ? (
                <div className={styles.header}>
                    <h4 className={styles.title}>{title}</h4>
                </div>
            ) : null}

            <div className={styles.splitLayout} ref={containerRef} style={splitLayoutStyle}>
                {/* ファイル構造の表示 */}
                {state.showFileStructure && (
                    <FileStructurePanel
                        resolvedHtmlPath={state.resolvedHtmlPath}
                        resolvedCssPath={state.resolvedCssPath}
                        resolvedJsPath={state.resolvedJsPath}
                        resolvedImages={state.resolvedImages}
                    />
                )}

                {/* エディタセクション（上段） */}
                <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
                    <Toolbar
                        resetProgress={handlers.resetProgress}
                        showLineNumbers={layout.showLineNumbers}
                        showFileStructure={state.showFileStructure}
                        onResetMouseDown={handlers.handleResetMouseDown}
                        onResetMouseUp={handlers.handleResetMouseUp}
                        onResetMouseLeave={handlers.handleResetMouseLeave}
                        onToggleLineNumbers={handlers.toggleLineNumbers}
                        onToggleFileStructure={handlers.toggleFileStructure}
                    />

                    {layout.visibleEditorConfigs.map((config, index) => {
                        const nextConfig = layout.visibleEditorConfigs[index + 1];

                        return (
                            <React.Fragment key={config.key}>
                                <EditorPanel
                                    config={config}
                                    width={layout.sectionWidths[config.key as EditorKey]}
                                    height={layout.editorHeight}
                                    theme={state.editorTheme}
                                    showLineNumbers={layout.showLineNumbers}
                                    options={editorOptions}
                                />
                                {nextConfig ? (
                                    <div
                                        className={styles.resizer}
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label={`${config.label} と ${nextConfig.label} の幅を調整`}
                                        tabIndex={0}
                                        onMouseDown={event => handlers.handleMouseDown(event, config.key as EditorKey, nextConfig.key as EditorKey)}
                                        onKeyDown={event => handlers.handleResizerKeyDown(event, config.key as EditorKey, nextConfig.key as EditorKey)}
                                        onDoubleClick={event => {
                                            event.preventDefault();
                                            handlers.resetSectionWidthsToAuto();
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
                {(visibility.showPreview || visibility.showHTMLEditor || visibility.showCSSEditor || visibility.showJSEditor || visibility.showConsole) && (
                    <div className={styles.previewSection} style={{ display: visibility.showPreview ? 'flex' : 'none' }}>
                        <div className={styles.sectionHeader}>プレビュー</div>
                        <div className={styles.previewContainer}>
                            <PreviewPanel
                                iframeRef={iframeRef}
                                iframeKey={state.iframeKey}
                                iframeId={state.iframeId}
                                htmlCode={state.htmlCode}
                                cssCode={state.cssCode}
                                jsCode={state.jsCode}
                                showPreview={visibility.showPreview}
                                showConsole={visibility.showConsole}
                                showHTMLEditor={visibility.showHTMLEditor}
                                showJSEditor={visibility.showJSEditor}
                                imageBasePath={imageBasePath}
                                resolvedImages={state.resolvedImages}
                                cssPath={cssPath}
                                jsPath={jsPath}
                                resolvedHtmlPath={state.resolvedHtmlPath}
                                resolvedCssPath={state.resolvedCssPath}
                                resolvedJsPath={state.resolvedJsPath}
                                previewHeight={layout.previewHeight}
                                minHeight={minHeight}
                                visible={true}
                            />
                        </div>
                    </div>
                )}
                {visibility.showConsole && (
                    <ConsolePanel logs={state.consoleLogs} />
                )}
            </div>
        </div>
    );
};
