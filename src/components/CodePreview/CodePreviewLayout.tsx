import type { CSSProperties } from 'react';
import styles from './styles.module.css';
import { FileStructurePanel } from './components/FileStructurePanel';
import { ConsolePanel } from './components/ConsolePanel';
import { EditorSection } from './components/EditorSection';
import { PreviewSection } from './components/PreviewSection';
import { useCodePreview } from './hooks/useCodePreview';


type UseCodePreviewResult = ReturnType<typeof useCodePreview>;

interface CodePreviewLayoutProps extends UseCodePreviewResult {
    title?: string;
    cssPath?: string;
    jsPath?: string;
}

export const CodePreviewLayout = ({
    elementRefs,
    state,
    visibility,
    layout,
    handlers,
    title,
    cssPath,
    jsPath,
}: CodePreviewLayoutProps) => {
    const {
        iframeRef,
        containerRef,
        editorsRowRef,
    } = elementRefs;

    const splitLayoutStyle: CSSProperties | undefined = visibility.showPreview ? undefined : { minHeight: 'auto' };
    const editorsRowStyle: CSSProperties | undefined = visibility.showPreview || visibility.showConsole ? undefined : { borderBottom: 'none' };

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
                <EditorSection
                    layout={layout}
                    state={state}
                    handlers={handlers}
                    editorsRowRef={editorsRowRef}
                    editorsRowStyle={editorsRowStyle}
                />

                {/* プレビュー（下段） */}
                <PreviewSection
                    visibility={visibility}
                    state={state}
                    layout={layout}
                    minHeightCss={layout.minHeightCss}
                    cssPath={cssPath}
                    jsPath={jsPath}
                    iframeRef={iframeRef}
                />

                {visibility.showConsole && (
                    <ConsolePanel logs={state.consoleLogs} />
                )}
            </div>
        </div>
    );
};
