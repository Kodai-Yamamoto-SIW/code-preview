import { getStoredSource } from '../store';

interface ResolveSourceProps {
    sourceId?: string;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: { [path: string]: string };
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}

export const resolveInitialSource = (props: ResolveSourceProps) => {
    const { sourceId, initialHTML, initialCSS, initialJS, images, htmlPath, cssPath, jsPath } = props;

    const hasInitialHTML = initialHTML !== undefined;
    const hasInitialCSS = initialCSS !== undefined;
    const hasInitialJS = initialJS !== undefined;

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

    return {
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
    };
};
