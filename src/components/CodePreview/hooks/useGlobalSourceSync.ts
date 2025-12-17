import { useEffect, useRef } from 'react';
import { getStoredSource, subscribeToStore } from '../store';
import { ensureTrailingNewline } from '../utils/stringUtils';

interface UseGlobalSourceSyncProps {
    sourceId?: string;
    setHtmlCode: (code: string) => void;
    setCssCode: (code: string) => void;
    setJsCode: (code: string) => void;
    hasInitialHTML: boolean;
    hasInitialCSS: boolean;
    hasInitialJS: boolean;
    initialStateRef: React.MutableRefObject<{ html: string; css: string; js: string }>;
}

export const useGlobalSourceSync = ({
    sourceId,
    setHtmlCode,
    setCssCode,
    setJsCode,
    hasInitialHTML,
    hasInitialCSS,
    hasInitialJS,
    initialStateRef
}: UseGlobalSourceSyncProps) => {
    const capturedInitialRef = useRef({
        html: !!(sourceId ? hasInitialHTML : true),
        css: !!(sourceId ? hasInitialCSS : true),
        js: !!(sourceId ? hasInitialJS : true),
    });

    useEffect(() => {
        if (!sourceId) return;

        const updateFromStore = () => {
            const stored = getStoredSource(sourceId);
            if (stored) {
                if (!hasInitialHTML && stored.html) {
                    const code = ensureTrailingNewline(stored.html);
                    setHtmlCode(code);
                    if (!capturedInitialRef.current.html) {
                        initialStateRef.current.html = code;
                        capturedInitialRef.current.html = true;
                    }
                }
                if (!hasInitialCSS && stored.css) {
                    const code = ensureTrailingNewline(stored.css);
                    setCssCode(code);
                    if (!capturedInitialRef.current.css) {
                        initialStateRef.current.css = code;
                        capturedInitialRef.current.css = true;
                    }
                }
                if (!hasInitialJS && stored.js) {
                    const code = ensureTrailingNewline(stored.js);
                    setJsCode(code);
                    if (!capturedInitialRef.current.js) {
                        initialStateRef.current.js = code;
                        capturedInitialRef.current.js = true;
                    }
                }
            }
        };

        // Initial check
        updateFromStore();

        return subscribeToStore(sourceId, updateFromStore);
    }, [sourceId, hasInitialHTML, hasInitialCSS, hasInitialJS, setHtmlCode, setCssCode, setJsCode, initialStateRef]);
};
