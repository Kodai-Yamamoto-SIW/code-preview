/**
 * URLを解決するヘルパー関数
 * @param path 元のパス
 * @param base ベースパス
 * @param resolvedImages 解決済みの画像パスのマッピング
 * @returns 解決されたパス
 */
export const resolveUrl = (path: string, base: string, resolvedImages?: { [path: string]: string }): string => {
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
