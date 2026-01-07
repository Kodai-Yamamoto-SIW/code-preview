import type { RefObject } from 'react';
import styles from '../styles.module.css';
import { PreviewPanel } from './PreviewPanel';
import type { ImageMap } from '../types';

interface PreviewSectionProps {
    visibility: {
        showPreview: boolean;
        showConsole: boolean;
        showHTMLEditor: boolean;
        showJSEditor: boolean;
        showCSSEditor: boolean;
    };
    state: {
        iframeKey: number;
        htmlCode: string;
        cssCode: string;
        jsCode: string;
        resolvedImages?: ImageMap;
        resolvedHtmlPath?: string;
        resolvedCssPath?: string;
        resolvedJsPath?: string;
        iframeId: string;
    };
    layout: {
        previewHeight: string;
    };
    minHeightCss: string;
    cssPath?: string;
    jsPath?: string;
    iframeRef: RefObject<HTMLIFrameElement | null>;
}

export const PreviewSection = ({
    visibility,
    state,
    layout,
    minHeightCss,
    cssPath,
    jsPath,
    iframeRef
}: PreviewSectionProps) => {
    const shouldShow = visibility.showPreview || visibility.showHTMLEditor || visibility.showCSSEditor || visibility.showJSEditor || visibility.showConsole;

    if (!shouldShow) {
        return null;
    }

    return (
        <div className={styles.previewSection} style={{ display: visibility.showPreview ? 'flex' : 'none' }}>
            <div className={styles.sectionHeader}>プレビュー</div>
            <div className={styles.previewContainer}>
                <PreviewPanel
                    iframeRef={iframeRef}
                    iframeKey={state.iframeKey}
                    previewHeight={layout.previewHeight}
                    minHeightCss={minHeightCss}
                    visible={true}
                    generatorOptions={{
                        htmlCode: state.htmlCode,
                        cssCode: state.cssCode,
                        jsCode: state.jsCode,
                        showPreview: visibility.showPreview,
                        showConsole: visibility.showConsole,
                        showHTMLEditor: visibility.showHTMLEditor,
                        showJSEditor: visibility.showJSEditor,
                        resolvedImages: state.resolvedImages,
                        cssPath: cssPath,
                        jsPath: jsPath,
                        resolvedHtmlPath: state.resolvedHtmlPath,
                        resolvedCssPath: state.resolvedCssPath,
                        resolvedJsPath: state.resolvedJsPath,
                        iframeId: state.iframeId
                    }}
                />
            </div>
        </div>
    );
};
