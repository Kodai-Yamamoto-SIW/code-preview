export const processImagePaths = (code: string, imageBasePath?: string, resolvedImages?: { [path: string]: string }): string => {
    if (!imageBasePath && !resolvedImages) return code;

    let base = imageBasePath || '';
    if (base && !base.endsWith('/')) base += '/';

    const resolvePath = (path: string): string => {
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

    // 属性値の置換 (src, href, srcset)
    // (^|[\s"'>\/])(src|href|srcset)\s*=\s*(["'])(.*?)\3
    // (^|[\s"'>\/]): 属性名の前は空白、クォート、タグ終了、スラッシュ、または行頭 (data-srcなどを除外)
    // (src|href|srcset): 対象の属性
    // \s*: =の前後のスペースを許容
    // (["']): クォートをキャプチャ
    // (.*?): 値をキャプチャ (非貪欲)
    // \3: 同じクォートで閉じる
    // \s*=\s* をキャプチャして元のスペースを保持する
    return code.replace(new RegExp('(^|[\\s"\'>/])(src|href|srcset)(\\s*=\\s*)(["\'])(.*?)\\4', 'gi'), (match, prefix, attr, equals, quote, value) => {
        if (attr.toLowerCase() === 'srcset') {
            const newValue = value.split(',').map((part: string) => {
                const trimmed = part.trim();
                const spaceIndex = trimmed.indexOf(' ');
                if (spaceIndex === -1) {
                    return resolvePath(trimmed);
                }
                const url = trimmed.slice(0, spaceIndex);
                const descriptor = trimmed.slice(spaceIndex);
                return resolvePath(url) + descriptor;
            }).join(', ');
            return `${prefix}${attr}${equals}${quote}${newValue}${quote}`;
        }
        return `${prefix}${attr}${equals}${quote}${resolvePath(value)}${quote}`;
    });
};

export const escapeScriptEndTag = (code: string): string => {
    return code.replace(/<\/script>/gi, '<' + '/script>');
};

export const resolveFilePaths = (html: string, cssPath?: string, cssCode?: string, jsPath?: string, jsCode?: string): { processed: string, jsInjected: boolean } => {
    let processed = html;
    let jsInjected = false;

    // CSSファイルのパスを解決
    if (cssPath && cssCode) {
        // <link ...> を全て検索
        processed = processed.replace(/<link\s+[^>]*>/gi, (match) => {
            // href属性のチェック
            const hrefRegex = new RegExp(`href\\s*=\\s*["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
            // rel="stylesheet" のチェック (rel='stylesheet' も可)
            const relRegex = /rel\s*=\s*["']stylesheet["']/i;

            if (hrefRegex.test(match) && relRegex.test(match)) {
                return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
            }
            return match;
        });
    }

    // JavaScriptファイルのパスを解決
    if (jsPath && jsCode) {
        // <script ...>...</script> を検索
        // 注意: <script>タグは中身がある場合とない場合があるが、srcがある場合は中身は空のはず（または無視される）
        // しかし、正規表現で <script ...>...</script> をマッチさせるのは難しい（ネストなど）。
        // ここでは src属性を持つ script タグを対象とする。
        // <script src="...">...</script> または <script src="..."></script>

        // シンプルに <script ... src="...">...</script> を探す
        // .*? は改行を含まないが、sフラグ(dotAll)がない場合。JSのRegExpでは [\s\S]*? を使う。

        const scriptRegex = /<script\s+([^>]*?)>([\s\S]*?)<\/script>/gi;

        processed = processed.replace(scriptRegex, (match, attrs, _content) => {
            const srcRegex = new RegExp(`src\\s*=\\s*["']${jsPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
            if (srcRegex.test(attrs)) {
                jsInjected = true;
                return `<script data-from-file="${jsPath}">\n${jsCode}\n</script>`;
            }
            return match;
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
    const processed = processImagePaths(code, imageBasePath, resolvedImages);
    return resolveFilePaths(processed, cssPath, cssCode, jsPath, jsCode);
};
