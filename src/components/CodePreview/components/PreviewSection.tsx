import React from 'react';
import styles from '../styles.module.css';
import { PreviewPanel } from './PreviewPanel';

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
        resolvedImages?: { [path: string]: string };
        resolvedHtmlPath?: string;
        resolvedCssPath?: string;
        resolvedJsPath?: string;
        iframeId: string;
    };
    layout: {
        previewHeight: string;
    };
    minHeight: string;
    imageBasePath?: string;
    cssPath?: string;
    jsPath?: string;
    iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
    visibility,
    state,
    layout,
    minHeight,
    imageBasePath,
    cssPath,
    jsPath,
    iframeRef
}) => {
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
                    minHeight={minHeight}
                    visible={true}
                    generatorOptions={{
                        htmlCode: state.htmlCode,
                        cssCode: state.cssCode,
                        jsCode: state.jsCode,
                        showPreview: visibility.showPreview,
                        showConsole: visibility.showConsole,
                        showHTMLEditor: visibility.showHTMLEditor,
                        showJSEditor: visibility.showJSEditor,
                        imageBasePath: imageBasePath,
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
