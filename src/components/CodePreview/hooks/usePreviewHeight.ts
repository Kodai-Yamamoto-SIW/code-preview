import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorDefinition } from '../types';

interface UsePreviewHeightProps {
    minHeightPx: number;
    showPreview: boolean;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    editors: EditorDefinition[];
}

const MAX_PREVIEW_HEIGHT = 800;

export const usePreviewHeight = ({
    minHeightPx,
    showPreview,
    iframeRef,
    editors
}: UsePreviewHeightProps) => {
    const [previewHeight, setPreviewHeight] = useState(`${minHeightPx}px`);
    // Track the maximum height ever reached (only grows, never shrinks)
    const maxHeightRef = useRef(minHeightPx);

    // Reset max height when code changes (new iframe content)
    const resetMaxHeight = useCallback(() => {
        maxHeightRef.current = minHeightPx;
    }, [minHeightPx]);

    const calculatePreviewHeight = useCallback(() => {
        const iframe = iframeRef.current;
        let pHeight = minHeightPx;

        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument;
                if (iframeDoc) {
                    const calculatedHeight = Math.max(
                        iframeDoc.body?.scrollHeight || 0,
                        iframeDoc.body?.offsetHeight || 0,
                        iframeDoc.documentElement?.clientHeight || 0,
                        iframeDoc.documentElement?.scrollHeight || 0,
                        iframeDoc.documentElement?.offsetHeight || 0
                    );
                    pHeight = Math.max(pHeight, calculatedHeight);
                }
            } catch {
                // noop
            }
        }

        // Only grow, never shrink - update maxHeightRef if we have a larger height
        if (pHeight > maxHeightRef.current) {
            maxHeightRef.current = pHeight;
        }

        const finalPreviewHeight = Math.max(maxHeightRef.current, minHeightPx);
        const limitedPreviewHeight = Math.min(finalPreviewHeight, MAX_PREVIEW_HEIGHT);

        setPreviewHeight(limitedPreviewHeight + 'px');
    }, [iframeRef, minHeightPx]);

    const requestPreviewHeight = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) {
            return;
        }

        try {
            iframe.contentWindow.postMessage({ type: 'codePreviewHeightRequest' }, '*');
        } catch {
            // noop
        }
    }, [iframeRef]);

    const updatePreviewHeight = useCallback(() => {
        if (!showPreview) return;
        setTimeout(() => {
            calculatePreviewHeight();
            requestPreviewHeight();
        }, 100);
    }, [showPreview, calculatePreviewHeight, requestPreviewHeight]);

    // Handle height change messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) {
                return;
            }
            if (event.data?.type === 'codePreviewHeightChange' &&
                typeof event.data.height === 'number') {
                const newHeight = event.data.height;
                // Only grow, never shrink
                if (newHeight > maxHeightRef.current) {
                    maxHeightRef.current = newHeight;
                    const limitedHeight = Math.min(newHeight, MAX_PREVIEW_HEIGHT);
                    setPreviewHeight(limitedHeight + 'px');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [iframeRef]);

    // Initial load and resize
    useEffect(() => {
        if (!showPreview) return;
        const iframe = iframeRef.current;
        if (iframe) {
            const handleLoad = () => {
                updatePreviewHeight();
                setTimeout(updatePreviewHeight, 100);
                setTimeout(updatePreviewHeight, 500);
            };

            iframe.addEventListener('load', handleLoad);
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                handleLoad();
            }
            return () => iframe.removeEventListener('load', handleLoad);
        }
    }, [showPreview, iframeRef, updatePreviewHeight]);

    // Code change - reset max height and recalculate
    useEffect(() => {
        if (showPreview) {
            resetMaxHeight();
            updatePreviewHeight();
        }
    }, [editors, minHeightPx, showPreview, resetMaxHeight, updatePreviewHeight]);

    // Window resize
    useEffect(() => {
        const handleResize = () => {
            updatePreviewHeight();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updatePreviewHeight]);

    return { previewHeight, updatePreviewHeight };
};
