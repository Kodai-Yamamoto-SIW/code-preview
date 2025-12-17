export const resolvePath = (baseFile: string, relativePath: string): string => {
    const stack = baseFile.split('/');
    stack.pop(); // ファイル名を除去してディレクトリにする

    const parts = relativePath.split('/');
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(part);
        }
    }
    return stack.join('/');
};

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
