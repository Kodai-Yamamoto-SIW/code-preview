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
export const processImagePaths = (code: string, imageBasePath?: string): string => {
    if (!imageBasePath) return code;

    let base = imageBasePath;
    if (!base.endsWith('/')) base += '/';

    return code.replace(/src="([^"]+)"/g, (match, src) => {
        if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
            return match;
        }
        return `src="${base}${src}"`;
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
    jsCode?: string
): { processed: string, jsInjected: boolean } => {
    let processed = processImagePaths(code, imageBasePath);
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

    const { processed: processedHtmlRaw, jsInjected } = processHtmlCode(htmlCode, imageBasePath, targetCssPath, cssCode, targetJsPath, jsCode);
    const processedHtml = escapeScriptEndTag(processedHtmlRaw);
    const processedCss = processCssCode(cssCode, resolvedImages);
    const styleTag = processedCss ? `<style>\n${processedCss}\n</style>` : '';
    const extraJs = (!jsInjected && jsCode) ? `<script>\n${escapeScriptEndTag(jsCode)}\n</script>` : '';
    const consoleScriptTag = (showPreview || showConsole || showHTMLEditor || showJSEditor)
        ? `<script data-code-preview-internal="true">
(function () {
if (!window.parent) return;
const logs = [];
const MAX_HTML_LENGTH = 300;
                        const INTERNAL_SCRIPT_SELECTOR = 'script[data-code-preview-internal]';

                        const currentScript = document.currentScript;

                        const removeInternalScripts = root => {
                            if (!root || typeof root.querySelectorAll !== 'function') return;
                            try {
                                const scripts = root.querySelectorAll(INTERNAL_SCRIPT_SELECTOR);
                                for (let index = 0; index < scripts.length; index++) {
                                    const script = scripts[index];
                                    if (!script || script === currentScript) continue;
                                    if (script.parentNode) {
                                        script.parentNode.removeChild(script);
                                    }
                                }
                            } catch (error) {
                                // noop
                            }
                        };

                        const removeCurrentScript = () => {
                            if (currentScript && currentScript.parentNode) {
                                currentScript.parentNode.removeChild(currentScript);
                            }
                        };

                        removeInternalScripts(document);
                        removeCurrentScript();

const postLogs = () => {
    try {
        window.parent.postMessage({ type: 'codePreviewConsoleLog', messages: logs.slice() }, '*');
    } catch (error) {
        // noop
    }
};

const extractStackLocation = stack => {
    if (!stack) return '';
    try {
        const text = String(stack);
        const jsMatch = text.match(/(code-preview-js\.js:\d+:\d+)/);
        if (jsMatch && jsMatch[1]) return ' (' + jsMatch[1] + ')';
        const htmlMatch = text.match(/(about:srcdoc:\d+:\d+)/);
        if (htmlMatch && htmlMatch[1]) return ' (' + htmlMatch[1] + ')';
    } catch (error) {
        // noop
    }
    return '';
};

const truncate = text => {
    if (typeof text !== 'string') return text;
    if (text.length <= MAX_HTML_LENGTH) return text;
    return text.slice(0, MAX_HTML_LENGTH) + '…';
};

const describeElement = element => {
    try {
        const tag = element.tagName ? element.tagName.toLowerCase() : 'element';
        const id = element.id ? '#' + element.id : '';
        let classInfo = '';
        if (element.className && typeof element.className === 'string' && element.className.trim()) {
            classInfo = '.' + element.className.trim().split(/\s+/).join('.');
        }
        const summary = '<' + tag + id + classInfo + '>';
        const outer = element.outerHTML;
        if (outer) return truncate(outer);
        return summary;
    } catch (error) {
        return '<要素>';
    }
};

const describeNode = node => {
    if (node === null) return 'null';
    if (node === undefined) return 'undefined';

    if (typeof Node !== 'undefined' && node instanceof Node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent || '';
            return 'テキスト("' + truncate(textContent.trim()) + '")';
        }

        if (node.nodeType === Node.COMMENT_NODE) {
            return '<!-- ' + truncate(node.textContent || '') + ' -->';
        }

        if (typeof Element !== 'undefined' && node instanceof Element) {
            return describeElement(node);
        }

        if (typeof Document !== 'undefined' && node instanceof Document) {
            const html = node.documentElement ? node.documentElement.outerHTML || '' : '';
            return html ? truncate(html) : 'ドキュメント';
        }

        if (typeof DocumentFragment !== 'undefined' && node instanceof DocumentFragment) {
            return 'ドキュメントフラグメント';
        }
    }

    return String(node);
};

const describeCollection = collection => {
    try {
        const arr = Array.from(collection);
        const items = arr.map(item => describeNode(item)).join(', ');
        return '[' + items + ']';
    } catch (error) {
        return String(collection);
    }
};

const formatValue = val => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return '"' + truncate(val) + '"';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return String(val);
    if (typeof val === 'function') return '関数';
    if (Array.isArray(val)) {
        return '[' + val.map(formatValue).join(', ') + ']';
    }
    if (typeof NodeList !== 'undefined' && val instanceof NodeList) return describeCollection(val);
    if (typeof HTMLCollection !== 'undefined' && val instanceof HTMLCollection) return describeCollection(val);
    if (typeof Node !== 'undefined' && val instanceof Node) return describeNode(val);
    
    if (typeof val === 'object') {
        try {
            const keys = Object.keys(val);
            const props = keys.map(k => k + ': ' + formatValue(val[k])).join(', ');
            return '{' + props + '}';
        } catch (e) {
            return String(val);
        }
    }
    return String(val);
};

const originalLog = console.log;
console.log = function (...args) {
    logs.push(args.map(formatValue).join(' '));
    postLogs();
    originalLog.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
    logs.push('[エラー] ' + args.map(formatValue).join(' '));
    postLogs();
    originalError.apply(console, args);
};

window.onerror = function (msg, url, line, col, error) {
    logs.push('[エラー] ' + msg + (line ? ' (' + line + '行目)' : ''));
    postLogs();
};
})();
</script>`
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
