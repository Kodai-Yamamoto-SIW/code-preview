import { useEffect } from 'react';
import { getStoredSource, setStoredSource, notifyStoreUpdate } from '../store';
import { SourceCodeState } from '../types';

interface UseGlobalSourceProviderProps {
    sourceId?: string;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: { [path: string]: string };
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
    hasInitialHTML: boolean;
    hasInitialCSS: boolean;
    hasInitialJS: boolean;
}

export const useGlobalSourceProvider = (props: UseGlobalSourceProviderProps) => {
    const {
        sourceId,
        initialHTML,
        initialCSS,
        initialJS,
        images,
        htmlPath,
        cssPath,
        jsPath,
        hasInitialHTML,
        hasInitialCSS,
        hasInitialJS
    } = props;

    const isSourceProvider = sourceId && (hasInitialHTML || hasInitialCSS || hasInitialJS);

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
};
