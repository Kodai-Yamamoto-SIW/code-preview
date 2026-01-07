import type { ImageMap } from '../types';

export const buildFileStructure = (
    resolvedHtmlPath?: string,
    resolvedCssPath?: string,
    resolvedJsPath?: string,
    resolvedImages?: ImageMap
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

        const normalizedPath = path.replace(/\\/g, '/');
        const parts = normalizedPath.split('/');
        if (parts.length === 1) {
            // ルートファイル
            if (!rootFiles.includes(normalizedPath)) rootFiles.push(normalizedPath);
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
