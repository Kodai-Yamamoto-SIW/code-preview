import { DefaultAttributeProcessor, SrcSetAttributeProcessor, AttributeProcessor } from './attributeProcessor';
import { injectCss, injectJs } from './codeInjector';

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

    const processors: { [key: string]: AttributeProcessor } = {
        'srcset': new SrcSetAttributeProcessor(),
        'default': new DefaultAttributeProcessor()
    };

    // 属性値の置換 (src, href, srcset)
    // (^|[\s"'>\/])(src|href|srcset)\s*=\s*(["'])(.*?)\3
    const attrRegex = /(^|[\s"'>/])(src|href|srcset)(\s*=\s*)(["'])(.*?)\4/gi;

    return code.replace(attrRegex, (match, prefix, attr, equals, quote, value) => {
        const processor = processors[attr.toLowerCase()] || processors['default'];
        const newValue = processor.process(value, base, resolvedImages);
        return `${prefix}${attr}${equals}${quote}${newValue}${quote}`;
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
