import React from 'react';
import styles from '../styles.module.css';
import { generatePreviewDocument } from '../utils/previewGenerator';

interface PreviewPanelProps {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    iframeKey: number;
    iframeId: string;
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    showPreview: boolean;
    showConsole: boolean;
    showHTMLEditor: boolean;
    showJSEditor: boolean;
    imageBasePath?: string;
    resolvedImages?: { [path: string]: string };
    cssPath?: string;
    jsPath?: string;
    resolvedHtmlPath?: string;
    resolvedCssPath?: string;
    resolvedJsPath?: string;
    previewHeight: string;
    minHeight: string;
    visible: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
    iframeRef,
    iframeKey,
    iframeId,
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
    resolvedJsPath,
    previewHeight,
    minHeight,
    visible
}) => {
    return (
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
                resolvedJsPath,
                iframeId
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
};
