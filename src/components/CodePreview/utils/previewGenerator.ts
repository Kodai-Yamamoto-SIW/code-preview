import { CONSOLE_INTERCEPT_SCRIPT, HEIGHT_OBSERVER_SCRIPT } from './consoleScript';
import { processCssCode } from './cssProcessor';
import { processHtmlCode, escapeScriptEndTag } from './htmlProcessor';
import type { ImageMap } from '../types';

export interface PreviewGeneratorOptions {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    showPreview: boolean;
    showConsole: boolean;
    showHTMLEditor: boolean;
    showJSEditor: boolean;
    resolvedImages?: ImageMap;
    cssPath?: string;
    jsPath?: string;
    resolvedHtmlPath?: string;
    resolvedCssPath?: string;
    resolvedJsPath?: string;
    iframeId?: string;
}

// iframeへ渡すHTML
export const generatePreviewDocument = (options: PreviewGeneratorOptions): string => {
    const {
        htmlCode,
        cssCode,
        jsCode,
        showPreview,
        showConsole,
        showHTMLEditor,
        showJSEditor,
        resolvedImages,
        cssPath,
        jsPath,
        resolvedHtmlPath,
        resolvedCssPath,
        resolvedJsPath
    } = options;

    // Use resolved paths if available, otherwise fallback to raw paths
    const targetCssPath = resolvedCssPath || cssPath;
    const targetJsPath = resolvedJsPath || jsPath;

    const { processed: processedHtmlRaw, jsInjected } = processHtmlCode(
        htmlCode,
        targetCssPath,
        cssCode,
        targetJsPath,
        jsCode,
        resolvedImages,
        resolvedHtmlPath
    );
    const processedHtml = escapeScriptEndTag(processedHtmlRaw);
    const processedCss = processCssCode(cssCode, resolvedImages, targetCssPath);
    const styleTag = processedCss ? `<style>\n${processedCss}\n</style>` : '';
    const extraJs = (!jsInjected && jsCode) ? `<script>\n${escapeScriptEndTag(jsCode)}\n</script>` : '';
    const consoleScriptTag = (showPreview || showConsole || showHTMLEditor || showJSEditor)
        ? `<script data-code-preview-internal="true">${CONSOLE_INTERCEPT_SCRIPT}</script>`
        : '';
    // Height observer script to notify parent when content height changes dynamically
    const heightObserverScriptTag = showPreview && options.iframeId
        ? `<script data-code-preview-internal="true">${HEIGHT_OBSERVER_SCRIPT.replace('__IFRAME_ID__', options.iframeId)}</script>`
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${styleTag}
${consoleScriptTag}
${heightObserverScriptTag}
</head>
<body>
${processedHtml}
${extraJs}
</body>
</html>`;
};
