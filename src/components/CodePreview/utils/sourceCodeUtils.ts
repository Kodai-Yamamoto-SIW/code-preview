import { SourceCodeState, ImageMap } from '../types';

interface ResolveSourceProps {
    sourceId?: string;
    storedState?: SourceCodeState;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    images?: ImageMap;
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}

export const resolveInitialSource = (props: ResolveSourceProps) => {
    const { sourceId, storedState, initialHTML, initialCSS, initialJS, images, htmlPath, cssPath, jsPath } = props;

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

    if (sourceId && storedState) {
        const stored = storedState;
        if (!hasInitialHTML && stored.html) resolvedHTML = stored.html;
        if (!hasInitialCSS && stored.css) resolvedCSS = stored.css;
        if (!hasInitialJS && stored.js) resolvedJS = stored.js;
        if (!images && stored.images) resolvedImages = stored.images;
        if (!htmlPath && stored.htmlPath) resolvedHtmlPath = stored.htmlPath;
        if (!cssPath && stored.cssPath) resolvedCssPath = stored.cssPath;
        if (!jsPath && stored.jsPath) resolvedJsPath = stored.jsPath;
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
