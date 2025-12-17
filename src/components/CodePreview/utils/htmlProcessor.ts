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

    return code.replace(/(src|href|srcset)=(["'])(.*?)\2/g, (match, attr, quote, value) => {
        if (attr === 'srcset') {
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
            return `${attr}=${quote}${newValue}${quote}`;
        }
        return `${attr}=${quote}${resolvePath(value)}${quote}`;
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
    const processed = processImagePaths(code, imageBasePath, resolvedImages);
    return resolveFilePaths(processed, cssPath, cssCode, jsPath, jsCode);
};
