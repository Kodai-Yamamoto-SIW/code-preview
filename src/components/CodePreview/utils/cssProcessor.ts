import { resolvePath } from './pathUtils';

export const processCssCode = (code: string, resolvedImages?: { [path: string]: string }, cssPath?: string): string => {
    if (!resolvedImages) return code;
    return code.replace(/url\((['"]?)([^)'"]+)\1\)/g, (match, quote, path) => {
        let resolvedPath = path;
        
        if (cssPath) {
            // cssPathがある場合は、それに基づき相対パスを解決する
            resolvedPath = resolvePath(cssPath, path);
        } else {
            // cssPathがない場合（インラインなど）は、従来の簡易的な正規化を行う（後方互換性のため）
            // ただし、誤った解決を防ぐため、単純な置換は避けるべきだが、
            // 既存の挙動を維持しつつ、明らかに誤ったパス（例: img/fence.png がルートにあると仮定）のみ許容する
            // ここでは、cssPathがない＝ルートにあると仮定して処理する
            resolvedPath = resolvePath('root.css', path);
        }

        if (resolvedImages[resolvedPath]) {
            return `url(${quote}${resolvedImages[resolvedPath]}${quote})`;
        }
        return match;
    });
};
