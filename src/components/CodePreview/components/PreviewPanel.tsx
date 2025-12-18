import React from 'react';
import styles from '../styles.module.css';
import { generatePreviewDocument, PreviewGeneratorOptions } from '../utils/previewGenerator';

interface PreviewPanelProps {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    iframeKey: number;
    previewHeight: string;
    minHeight: string;
    visible: boolean;
    generatorOptions: PreviewGeneratorOptions;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
    iframeRef,
    iframeKey,
    previewHeight,
    minHeight,
    visible,
    generatorOptions
}) => {
    return (
        <iframe
            key={`${visible ? 'visible' : 'hidden'}-${iframeKey}`}
            ref={iframeRef}
            srcDoc={generatePreviewDocument(generatorOptions)}
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
