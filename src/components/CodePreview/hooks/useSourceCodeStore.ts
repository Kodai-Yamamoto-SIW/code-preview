import { useState, useEffect, useRef } from 'react';
import { getStoredSource, setStoredSource, subscribeToStore, notifyStoreUpdate, SourceCodeState } from '../store';

interface UseSourceCodeStoreProps {
    sourceId?: string;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: { [path: string]: string };
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}

export const useSourceCodeStore = (props: UseSourceCodeStoreProps) => {
    const { sourceId, initialHTML, initialCSS, initialJS, images, htmlPath, cssPath, jsPath } = props;

    const hasInitialHTML = initialHTML !== undefined;
    const hasInitialCSS = initialCSS !== undefined;
    const hasInitialJS = initialJS !== undefined;
    const isSourceProvider = sourceId && (hasInitialHTML || hasInitialCSS || hasInitialJS);

    // Helper to ensure trailing newline
    const ensureTrailingNewline = (code: string): string => {
        if (code && !code.endsWith('\n')) {
            return code + '\n';
        }
        return code;
    };

    // Initial resolution logic (runs on every render to get latest from store if needed)
    let resolvedHTML = initialHTML;
    let resolvedCSS = initialCSS;
    let resolvedJS = initialJS;
    let resolvedImages = images;
    let resolvedHtmlPath = htmlPath;
    let resolvedCssPath = cssPath;
    let resolvedJsPath = jsPath;

    if (sourceId) {
        const stored = getStoredSource(sourceId);
        if (stored) {
            if (!hasInitialHTML && stored.html) resolvedHTML = stored.html;
            if (!hasInitialCSS && stored.css) resolvedCSS = stored.css;
            if (!hasInitialJS && stored.js) resolvedJS = stored.js;
            if (!images && stored.images) resolvedImages = stored.images;
            if (!htmlPath && stored.htmlPath) resolvedHtmlPath = stored.htmlPath;
            if (!cssPath && stored.cssPath) resolvedCssPath = stored.cssPath;
            if (!jsPath && stored.jsPath) resolvedJsPath = stored.jsPath;
        }
    }

    const [htmlCode, setHtmlCode] = useState(ensureTrailingNewline(resolvedHTML || ''));
    const [cssCode, setCssCode] = useState(ensureTrailingNewline(resolvedCSS || ''));
    const [jsCode, setJsCode] = useState(ensureTrailingNewline(resolvedJS || ''));

    // Refs to track if initial state is captured
    const initialStateRef = useRef({
        html: ensureTrailingNewline(resolvedHTML || ''),
        css: ensureTrailingNewline(resolvedCSS || ''),
        js: ensureTrailingNewline(resolvedJS || ''),
    });
    const capturedInitialRef = useRef({
        html: !!(sourceId ? hasInitialHTML : true),
        css: !!(sourceId ? hasInitialCSS : true),
        js: !!(sourceId ? hasInitialJS : true),
    });

    // Subscribe to store updates
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
    }, [sourceId, hasInitialHTML, hasInitialCSS, hasInitialJS]);

    // Update store if provider
    useEffect(() => {
        if (sourceId && isSourceProvider) {
            const existing = getStoredSource(sourceId) || { html: '', css: '', js: '' };
            const updated: SourceCodeState = {
                html: hasInitialHTML ? (initialHTML || '') : existing.html,
                css: hasInitialCSS ? (initialCSS || '') : existing.css,
                js: hasInitialJS ? (initialJS || '') : existing.js,
                images: images || existing.images,
                htmlPath: htmlPath || existing.htmlPath,
                cssPath: cssPath || existing.cssPath,
                jsPath: jsPath || existing.jsPath,
            };
            setStoredSource(sourceId, updated);
            notifyStoreUpdate(sourceId);
        }
    }, [sourceId, isSourceProvider, hasInitialHTML, hasInitialCSS, hasInitialJS, initialHTML, initialCSS, initialJS, images, htmlPath, cssPath, jsPath]);

    return {
        htmlCode, setHtmlCode,
        cssCode, setCssCode,
        jsCode, setJsCode,
        resolvedHTML,
        resolvedCSS,
        resolvedJS,
        resolvedImages,
        resolvedHtmlPath,
        resolvedCssPath,
        resolvedJsPath,
        initialStateRef,
        ensureTrailingNewline
    };
};
