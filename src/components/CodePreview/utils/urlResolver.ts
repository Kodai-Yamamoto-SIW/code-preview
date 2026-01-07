import { resolvePath } from './pathUtils';
import type { ImageMap } from '../types';

const isAbsoluteUrl = (path: string) => (
    path.startsWith('/') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:') ||
    path.startsWith('javascript:') ||
    path.startsWith('#') ||
    path.startsWith('//')
);

const normalizeRelativePath = (path: string) => {
    let normalized = path.replace(/^\.\//, '');
    while (normalized.startsWith('../')) {
        normalized = normalized.slice(3);
    }
    return normalized;
};

/**
 * Resolve a URL or path using an optional base URL and virtual image map.
 */
export const resolveUrl = (
    path: string,
    resolvedImages?: ImageMap,
    baseFilePath?: string
): string => {
    if (isAbsoluteUrl(path)) {
        return path;
    }

    if (resolvedImages) {
        const normalized = baseFilePath
            ? resolvePath(baseFilePath, path)
            : normalizeRelativePath(path);
        if (resolvedImages[normalized]) {
            return resolvedImages[normalized];
        }
    }

    return path;
};
