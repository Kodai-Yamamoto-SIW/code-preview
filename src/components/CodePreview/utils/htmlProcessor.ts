import { DefaultAttributeProcessor, SrcSetAttributeProcessor } from './attributeProcessor';
import { injectCss, injectJs } from './codeInjector';
import type { ImageMap } from '../types';

const RESOLVE_ATTRIBUTES = ['src', 'srcset'];

/**
 * Resolve image-related attribute values in HTML.
 */
export const processImagePaths = (
    code: string,
    resolvedImages?: ImageMap,
    htmlPath?: string
): string => {
    if (!resolvedImages) return code;

    const processors = {
        srcset: new SrcSetAttributeProcessor(),
        default: new DefaultAttributeProcessor()
    } as const;

    const attrPattern = RESOLVE_ATTRIBUTES.join('|');
    const attrRegex = new RegExp(`(^|[\\s"'>/])(${attrPattern})(\\s*=\\s*)(["'])(.*?)\\4`, 'gi');

    return code.replace(attrRegex, (match, prefix, attr, equals, quote, value) => {
        const key = String(attr).toLowerCase();
        const processor = key === 'srcset' ? processors.srcset : processors.default;
        const newValue = processor.process(value, resolvedImages, htmlPath);
        return `${prefix}${attr}${equals}${quote}${newValue}${quote}`;
    });
};

/**
 * Escape </script> tags in HTML to prevent premature termination.
 */
export const escapeScriptEndTag = (code: string): string => {
    return code.replace(/<\/script>/gi, '<' + '/script>');
};

/**
 * Inline matching CSS/JS file paths into the HTML.
 */
export const resolveFilePaths = (
    html: string,
    cssPath?: string,
    cssCode?: string,
    jsPath?: string,
    jsCode?: string
): { processed: string, jsInjected: boolean } => {
    let processed = html;
    let jsInjected = false;

    if (cssPath && cssCode) {
        processed = injectCss(processed, cssPath, cssCode);
    }

    if (jsPath && jsCode) {
        const result = injectJs(processed, jsPath, jsCode);
        processed = result.processed;
        jsInjected = result.injected;
    }

    return { processed, jsInjected };
};

/**
 * Process HTML with asset resolution and inline file injection.
 */
export const processHtmlCode = (
    code: string,
    cssPath?: string,
    cssCode?: string,
    jsPath?: string,
    jsCode?: string,
    resolvedImages?: ImageMap,
    htmlPath?: string
): { processed: string, jsInjected: boolean } => {
    const processed = processImagePaths(code, resolvedImages, htmlPath);
    return resolveFilePaths(processed, cssPath, cssCode, jsPath, jsCode);
};
