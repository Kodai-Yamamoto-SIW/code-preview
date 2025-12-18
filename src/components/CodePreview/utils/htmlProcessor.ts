/**
 * URLを解決するヘルパー関数
 * @param path 元のパス
 * @param base ベースパス
 * @param resolvedImages 解決済みの画像パスのマッピング
 * @returns 解決されたパス
 */
const resolveUrl = (path: string, base: string, resolvedImages?: { [path: string]: string }): string => {
    if (path.startsWith('/') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }

    // resolvedImagesがある場合、そちらを優先
    if (resolvedImages) {
        // 相対パス正規化（../img/〜, ./img/〜, img/〜 など）
        let norm = path.replace(/^\.\//, '');
        if (norm.startsWith('..')) {
            norm = norm.replace(/^\.\.\//, '');
        }
        if (resolvedImages[norm]) {
            return resolvedImages[norm];
        }
    }

    if (base) {
        return `${base}${path}`;
    }

    return path;
};

/**
 * HTMLコード内の画像パスなどを処理する関数
 * @param code HTMLコード
 * @param imageBasePath 画像のベースパス
 * @param resolvedImages 解決済みの画像パスのマッピング
 * @returns 処理されたHTMLコード
 */
export const processImagePaths = (code: string, imageBasePath?: string, resolvedImages?: { [path: string]: string }): string => {
    if (!imageBasePath && !resolvedImages) return code;

    let base = imageBasePath || '';
    if (base && !base.endsWith('/')) base += '/';

    // 属性値の置換 (src, href, srcset)
    // (^|[\s"'>\/])(src|href|srcset)\s*=\s*(["'])(.*?)\3
    // (^|[\s"'>\/]): 属性名の前は空白、クォート、タグ終了、スラッシュ、または行頭 (data-srcなどを除外)
    // (src|href|srcset): 対象の属性
    // \s*: =の前後のスペースを許容
    // (["']): クォートをキャプチャ
    // (.*?): 値をキャプチャ (非貪欲)
    // \4: 同じクォートで閉じる (\3ではなく\4になることに注意: 1:prefix, 2:attr, 3:equals, 4:quote)
    const attrRegex = /(^|[\s"'>/])(src|href|srcset)(\s*=\s*)(["'])(.*?)\4/gi;

    return code.replace(attrRegex, (match, prefix, attr, equals, quote, value) => {
        if (attr.toLowerCase() === 'srcset') {
            const newValue = value.split(',').map((part: string) => {
                const trimmed = part.trim();
                const spaceIndex = trimmed.indexOf(' ');
                if (spaceIndex === -1) {
                    return resolveUrl(trimmed, base, resolvedImages);
                }
                const url = trimmed.slice(0, spaceIndex);
                const descriptor = trimmed.slice(spaceIndex);
                return resolveUrl(url, base, resolvedImages) + descriptor;
            }).join(', ');
            return `${prefix}${attr}${equals}${quote}${newValue}${quote}`;
        }
        return `${prefix}${attr}${equals}${quote}${resolveUrl(value, base, resolvedImages)}${quote}`;
    });
};

/**
 * scriptタグの終了タグをエスケープする関数
 * @param code HTMLコード
 * @returns エスケープされたHTMLコード
 */
export const escapeScriptEndTag = (code: string): string => {
    return code.replace(/<\/script>/gi, '<' + '/script>');
};

/**
 * CSSファイルを注入するヘルパー関数
 * @param html HTMLコード
 * @param cssPath CSSファイルのパス
 * @param cssCode CSSコード
 * @returns 処理されたHTMLコード
 */
const injectCss = (html: string, cssPath: string, cssCode: string): string => {
    // <link ...> を全て検索
    return html.replace(/<link\s+[^>]*>/gi, (match) => {
        // href属性のチェック
        const hrefRegex = new RegExp(`href\\s*=\\s*["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
        // rel="stylesheet" のチェック (rel='stylesheet' も可)
        const relRegex = /rel\s*=\s*["']stylesheet["']/i;

        if (hrefRegex.test(match) && relRegex.test(match)) {
            return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
        }
        return match;
    });
};

/**
 * JSファイルを注入するヘルパー関数
 * @param html HTMLコード
 * @param jsPath JSファイルのパス
 * @param jsCode JSコード
 * @returns 処理されたHTMLコードと注入されたかどうかのフラグ
 */
const injectJs = (html: string, jsPath: string, jsCode: string): { processed: string, injected: boolean } => {
    let injected = false;
    // <script ... src="...">...</script> を探す
    // [\s\S]*? は改行を含む任意の文字にマッチ (dotAll)
    const scriptRegex = /<script\s+([^>]*?)>([\s\S]*?)<\/script>/gi;

    const processed = html.replace(scriptRegex, (match, attrs, _content) => {
        const srcRegex = new RegExp(`src\\s*=\\s*["']${jsPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
        if (srcRegex.test(attrs)) {
            injected = true;
            return `<script data-from-file="${jsPath}">\n${jsCode}\n</script>`;
        }
        return match;
    });

    return { processed, injected };
};

/**
 * HTMLコード内のCSS/JSファイルパスを解決してコードを埋め込む関数
 * @param html HTMLコード
 * @param cssPath CSSファイルのパス
 * @param cssCode CSSコード
 * @param jsPath JSファイルのパス
 * @param jsCode JSコード
 * @returns 処理されたHTMLコードとJSが注入されたかどうかのフラグ
 */
export const resolveFilePaths = (html: string, cssPath?: string, cssCode?: string, jsPath?: string, jsCode?: string): { processed: string, jsInjected: boolean } => {
    let processed = html;
    let jsInjected = false;

    // CSSファイルのパスを解決
    if (cssPath && cssCode) {
        processed = injectCss(processed, cssPath, cssCode);
    }

    // JavaScriptファイルのパスを解決
    if (jsPath && jsCode) {
        const result = injectJs(processed, jsPath, jsCode);
        processed = result.processed;
        jsInjected = result.injected;
    }

    return { processed, jsInjected };
};

/**
 * HTMLコード全体を処理するメイン関数
 * @param code HTMLコード
 * @param imageBasePath 画像のベースパス
 * @param cssPath CSSファイルのパス
 * @param cssCode CSSコード
 * @param jsPath JSファイルのパス
 * @param jsCode JSコード
 * @param resolvedImages 解決済みの画像パスのマッピング
 * @returns 処理されたHTMLコードとJSが注入されたかどうかのフラグ
 */
export const processHtmlCode = (
    code: string,
    imageBasePath?: string,
    cssPath?: string,
    cssCode?: string,
    jsPath?: string,
    jsCode?: string,
    resolvedImages?: { [path: string]: string }
): { processed: string, jsInjected: boolean } => {
    const processed = processImagePaths(code, imageBasePath, resolvedImages);
    return resolveFilePaths(processed, cssPath, cssCode, jsPath, jsCode);
};
