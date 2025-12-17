import { processImagePaths } from './pathUtils';

export const processAnchorLinks = (code: string): string =>
    code.replace(/href="#([^"]+)"/g, (match, id) => {
        return `href="javascript:void(0)" onclick="document.getElementById('${id}')?.scrollIntoView({behavior: 'smooth'})"`;
    });

export const escapeScriptEndTag = (code: string): string => {
    return code.replace(/<\/script>/gi, '<' + '/script>');
};

export const resolveFilePaths = (html: string, cssPath?: string, cssCode?: string, jsPath?: string, jsCode?: string): { processed: string, jsInjected: boolean } => {
    let processed = html;
    let jsInjected = false;

    // CSSファイルのパスを解決
    if (cssPath && cssCode) {
        // <link href="..." rel="stylesheet"> を検索して置き換え
        const linkRegex = new RegExp(
            `<link\\s+[^>]*href=["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
            'gi'
        );
        let replaced = false;
        processed = processed.replace(linkRegex, () => {
            replaced = true;
            return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
        });

        if (!replaced) {
            // 逆順も対応: rel="stylesheet" href="..."
            const linkRegex2 = new RegExp(
                `<link\\s+[^>]*rel=["']stylesheet["'][^>]*href=["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
                'gi'
            );
            processed = processed.replace(linkRegex2, () => {
                return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
            });
        }
    }

    // JavaScriptファイルのパスを解決
    if (jsPath && jsCode) {
        // <script src="..."></script> を検索して置き換え
        const scriptRegex = new RegExp(
            `<script\\s+[^>]*src=["']${jsPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*</script>`,
            'gi'
        );
        processed = processed.replace(scriptRegex, () => {
            jsInjected = true;
            return `<script data-from-file="${jsPath}">\n${jsCode}\n</script>`;
        });
    }

    return { processed, jsInjected };
};

export const processHtmlCode = (
    code: string,
    imageBasePath?: string,
    cssPath?: string,
    cssCode?: string,
    jsPath?: string,
    jsCode?: string,
    resolvedImages?: { [path: string]: string }
): { processed: string, jsInjected: boolean } => {
    let processed = processImagePaths(code, imageBasePath, resolvedImages);
    processed = processAnchorLinks(processed);
    return resolveFilePaths(processed, cssPath, cssCode, jsPath, jsCode);
};
