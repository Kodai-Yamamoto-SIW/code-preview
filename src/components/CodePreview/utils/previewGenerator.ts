import { CONSOLE_INTERCEPT_SCRIPT } from './consoleScript';

export interface PreviewGeneratorOptions {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    showPreview: boolean;
    showConsole: boolean;
    showHTMLEditor: boolean;
    showJSEditor: boolean;
    imageBasePath?: string;
    resolvedImages?: { [path: string]: string };
    cssPath?: string;
    jsPath?: string;
    resolvedHtmlPath?: string;
    resolvedCssPath?: string;
    resolvedJsPath?: string;
}

// 画像パスを変換する関数（相対パスにベースパスを前置）
export const processImagePaths = (code: string, imageBasePath?: string, resolvedImages?: { [path: string]: string }): string => {
    if (!imageBasePath && !resolvedImages) return code;

    let base = imageBasePath || '';
    if (base && !base.endsWith('/')) base += '/';

    return code.replace(/src=(["'])(.*?)\1/g, (match, quote, src) => {
        if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
            return match;
        }

        // resolvedImagesがある場合、そちらを優先
        if (resolvedImages) {
            // 相対パス正規化（../img/〜, ./img/〜, img/〜 など）
            let norm = src.replace(/^\.\//, '');
            if (norm.startsWith('..')) {
                norm = norm.replace(/^\.\.\//, '');
            }
            if (resolvedImages[norm]) {
                return `src=${quote}${resolvedImages[norm]}${quote}`;
            }
        }

        if (base) {
            return `src=${quote}${base}${src}${quote}`;
        }
        
        return match;
    });
};

// アンカーリンクをスムーススクロールに変換
export const processAnchorLinks = (code: string): string =>
    code.replace(/href="#([^"]+)"/g, (match, id) => {
        return `href="javascript:void(0)" onclick="document.getElementById('${id}')?.scrollIntoView({behavior: 'smooth'})"`;
    });

// </script> タグをエスケープする関数
export const escapeScriptEndTag = (code: string): string => {
    return code.replace(/<\/script>/gi, '<' + '/script>');
};

// CSS内のurl()をimagesマッピングで置換
export const processCssCode = (code: string, resolvedImages?: { [path: string]: string }): string => {
    if (!resolvedImages) return code;
    return code.replace(/url\((['"]?)([^)'"]+)\1\)/g, (match, quote, path) => {
        // 相対パス正規化（../img/〜, ./img/〜, img/〜 など）
        let norm = path.replace(/^\.\//, '');
        if (norm.startsWith('..')) {
            // 例: ../img/fence.png → img/fence.png
            norm = norm.replace(/^\.\.\//, '');
        }
        if (resolvedImages[norm]) {
            return `url(${quote}${resolvedImages[norm]}${quote})`;
        }
        return match;
    });
};

// ファイルパスを解決してインライン化
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

// HTMLコードを処理
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

// ファイル構造をツリー形式で生成
export const buildFileStructure = (
    resolvedHtmlPath?: string,
    resolvedCssPath?: string,
    resolvedJsPath?: string,
    resolvedImages?: { [path: string]: string }
): { folders: Map<string, string[]>; rootFiles: string[] } => {
    const folders = new Map<string, string[]>();
    const rootFiles: string[] = [];

    const files = [
        { path: resolvedHtmlPath },
        { path: resolvedCssPath },
        { path: resolvedJsPath },
    ];
    // imagesで指定された画像パスも追加
    if (resolvedImages) {
        Object.keys(resolvedImages).forEach(imgPath => {
            files.push({ path: imgPath });
        });
    }

    files.forEach(({ path }) => {
        if (!path) return;

        const parts = path.split('/');
        if (parts.length === 1) {
            // ルートファイル
            if (!rootFiles.includes(path)) rootFiles.push(path);
        } else {
            // フォルダ内のファイル
            const folderPath = parts.slice(0, -1).join('/');
            const fileName = parts[parts.length - 1];
            if (!folders.has(folderPath)) {
                folders.set(folderPath, []);
            }
            if (!folders.get(folderPath)!.includes(fileName)) {
                folders.get(folderPath)!.push(fileName);
            }
        }
    });

    return { folders, rootFiles };
};

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
        imageBasePath,
        resolvedImages,
        cssPath,
        jsPath,
        resolvedCssPath,
        resolvedJsPath
    } = options;

    // Use resolved paths if available, otherwise fallback to raw paths
    const targetCssPath = resolvedCssPath || cssPath;
    const targetJsPath = resolvedJsPath || jsPath;

    const { processed: processedHtmlRaw, jsInjected } = processHtmlCode(htmlCode, imageBasePath, targetCssPath, cssCode, targetJsPath, jsCode, resolvedImages);
    const processedHtml = escapeScriptEndTag(processedHtmlRaw);
    const processedCss = processCssCode(cssCode, resolvedImages);
    const styleTag = processedCss ? `<style>\n${processedCss}\n</style>` : '';
    const extraJs = (!jsInjected && jsCode) ? `<script>\n${escapeScriptEndTag(jsCode)}\n</script>` : '';
    const consoleScriptTag = (showPreview || showConsole || showHTMLEditor || showJSEditor)
        ? `<script data-code-preview-internal="true">${CONSOLE_INTERCEPT_SCRIPT}</script>`
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${styleTag}
${consoleScriptTag}
</head>
<body>
${processedHtml}
${extraJs}
</body>
</html>`;
};
