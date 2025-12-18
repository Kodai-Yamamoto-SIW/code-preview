/**
 * CSSファイルを注入するヘルパー関数
 * @param html HTMLコード
 * @param cssPath CSSファイルのパス
 * @param cssCode CSSコード
 * @returns 処理されたHTMLコード
 */
export const injectCss = (html: string, cssPath: string, cssCode: string): string => {
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
export const injectJs = (html: string, jsPath: string, jsCode: string): { processed: string, injected: boolean } => {
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
