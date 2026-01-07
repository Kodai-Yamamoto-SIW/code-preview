import { useEffect } from 'react';
import { ISourceCodeStore } from '../store';
import { SourceCodeState, ImageMap } from '../types';

interface UseGlobalSourceProviderProps {
    sourceId?: string;
    store: ISourceCodeStore;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: ImageMap;
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
        store,
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
            const existing = store.get(sourceId) || { html: '', css: '', js: '' };
            const updated: SourceCodeState = {
                html: hasInitialHTML ? (initialHTML || '') : existing.html,
                css: hasInitialCSS ? (initialCSS || '') : existing.css,
                js: hasInitialJS ? (initialJS || '') : existing.js,
                images: images || existing.images,
                htmlPath: htmlPath || existing.htmlPath,
                cssPath: cssPath || existing.cssPath,
                jsPath: jsPath || existing.jsPath,
            };
            store.set(sourceId, updated);
            store.notify(sourceId);
        }
    }, [sourceId, isSourceProvider, hasInitialHTML, hasInitialCSS, hasInitialJS, initialHTML, initialCSS, initialJS, images, htmlPath, cssPath, jsPath, store]);
};
