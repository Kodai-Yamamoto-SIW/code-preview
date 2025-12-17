import { useState, useEffect } from 'react';

interface UsePreviewHeightProps {
    minHeight: string;
    showPreview: boolean;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    htmlCode: string; // Trigger update on code change
    cssCode: string;
    jsCode: string;
}

export const usePreviewHeight = ({
    minHeight,
    showPreview,
    iframeRef,
    htmlCode,
    cssCode,
    jsCode
}: UsePreviewHeightProps) => {
    const [previewHeight, setPreviewHeight] = useState(minHeight);

    const calculatePreviewHeight = () => {
        const iframe = iframeRef.current;
        let pHeight = parseInt(minHeight);

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

        const finalPreviewHeight = Math.max(pHeight, parseInt(minHeight));
        const limitedPreviewHeight = Math.min(finalPreviewHeight, 800);

        setPreviewHeight(limitedPreviewHeight + 'px');
    };

    const updatePreviewHeight = () => {
        if (!showPreview) return;
        setTimeout(() => {
            calculatePreviewHeight();
        }, 100);
    };

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
    }, [showPreview, iframeRef.current]); // Added iframeRef.current dependency

    // Code change
    useEffect(() => {
        if (showPreview) {
            updatePreviewHeight();
        }
    }, [htmlCode, cssCode, jsCode, minHeight, showPreview]);

    // Window resize
    useEffect(() => {
        const handleResize = () => {
            updatePreviewHeight();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showPreview]);

    return { previewHeight, updatePreviewHeight };
};
