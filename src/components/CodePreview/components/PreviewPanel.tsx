import type { CSSProperties, RefObject } from 'react';
import styles from '../styles.module.css';
import { generatePreviewDocument, PreviewGeneratorOptions } from '../utils/previewGenerator';

interface PreviewPanelProps {
    iframeRef: RefObject<HTMLIFrameElement | null>;
    iframeKey: number;
    previewHeight: string;
    minHeightCss: string;
    visible: boolean;
    generatorOptions: PreviewGeneratorOptions;
}

export const PreviewPanel = ({
    iframeRef,
    iframeKey,
    previewHeight,
    minHeightCss,
    visible,
    generatorOptions
}: PreviewPanelProps) => {
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
                    ? ({ height: previewHeight, '--min-height': minHeightCss } as CSSProperties)
                    : ({ display: 'none' } as CSSProperties)
            }
        />
    );
};
