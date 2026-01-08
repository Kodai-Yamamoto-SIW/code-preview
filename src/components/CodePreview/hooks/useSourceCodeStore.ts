import { useState, useRef, useCallback, useMemo } from 'react';
import { ensureTrailingNewline, normalizeInitialCode } from '../utils/stringUtils';
import { resolveInitialSource } from '../utils/sourceCodeUtils';
import { useGlobalSourceSync } from './useGlobalSourceSync';
import { useGlobalSourceProvider } from './useGlobalSourceProvider';
import { ISourceCodeStore, globalSourceCodeStore } from '../store';
import type { ImageMap } from '../types';

interface UseSourceCodeStoreProps {
    sourceId?: string;
    store?: ISourceCodeStore;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: ImageMap;
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}

export const useSourceCodeStore = (props: UseSourceCodeStoreProps) => {
    const { store = globalSourceCodeStore, sourceId } = props;
    const normalizedInitialHTML = normalizeInitialCode(props.initialHTML);
    const normalizedInitialCSS = normalizeInitialCode(props.initialCSS);
    const normalizedInitialJS = normalizeInitialCode(props.initialJS);

    const scopedSourceId = useMemo(() => {
        if (!sourceId) return undefined;
        if (typeof window === 'undefined') return sourceId;
        return `${sourceId}:${window.location.pathname}`;
    }, [sourceId]);

    const storedState = (scopedSourceId && store) ? store.get(scopedSourceId) : undefined;

    const {
        resolvedHTML,
        resolvedCSS,
        resolvedJS,
        resolvedImages,
        resolvedHtmlPath,
        resolvedCssPath,
        resolvedJsPath,
        hasInitialHTML,
        hasInitialCSS,
        hasInitialJS
    } = resolveInitialSource({
        sourceId: scopedSourceId,
        storedState,
        initialHTML: normalizedInitialHTML,
        initialCSS: normalizedInitialCSS,
        initialJS: normalizedInitialJS,
        images: props.images,
        htmlPath: props.htmlPath,
        cssPath: props.cssPath,
        jsPath: props.jsPath
    });

    const [htmlCode, setHtmlCode] = useState(ensureTrailingNewline(resolvedHTML || ''));
    const [cssCode, setCssCode] = useState(ensureTrailingNewline(resolvedCSS || ''));
    const [jsCode, setJsCode] = useState(ensureTrailingNewline(resolvedJS || ''));

    const initialStateRef = useRef({
        html: ensureTrailingNewline(resolvedHTML || ''),
        css: ensureTrailingNewline(resolvedCSS || ''),
        js: ensureTrailingNewline(resolvedJS || ''),
    });

    useGlobalSourceSync({
        sourceId: scopedSourceId,
        store,
        setHtmlCode,
        setCssCode,
        setJsCode,
        hasInitialHTML,
        hasInitialCSS,
        hasInitialJS,
        initialStateRef
    });

    useGlobalSourceProvider({
        sourceId: scopedSourceId,
        store,
        initialHTML: normalizedInitialHTML,
        initialCSS: normalizedInitialCSS,
        initialJS: normalizedInitialJS,
        images: props.images,
        htmlPath: props.htmlPath,
        cssPath: props.cssPath,
        jsPath: props.jsPath,
        hasInitialHTML,
        hasInitialCSS,
        hasInitialJS
    });

    const resetCodes = useCallback(() => {
        setHtmlCode(initialStateRef.current.html);
        setCssCode(initialStateRef.current.css);
        setJsCode(initialStateRef.current.js);
    }, [setHtmlCode, setCssCode, setJsCode]);

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
        resetCodes
    };
};
