import { resolveUrl } from './urlResolver';
import type { ImageMap } from '../types';

export interface AttributeProcessor {
    process(value: string, resolvedImages?: ImageMap, baseFilePath?: string): string;
}

export class DefaultAttributeProcessor implements AttributeProcessor {
    process(value: string, resolvedImages?: ImageMap, baseFilePath?: string): string {
        return resolveUrl(value, resolvedImages, baseFilePath);
    }
}

export class SrcSetAttributeProcessor implements AttributeProcessor {
    process(value: string, resolvedImages?: ImageMap, baseFilePath?: string): string {
        return value.split(',').map((part: string) => {
            const trimmed = part.trim();
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex === -1) {
                return resolveUrl(trimmed, resolvedImages, baseFilePath);
            }
            const url = trimmed.slice(0, spaceIndex);
            const descriptor = trimmed.slice(spaceIndex);
            return resolveUrl(url, resolvedImages, baseFilePath) + descriptor;
        }).join(', ');
    }
}
