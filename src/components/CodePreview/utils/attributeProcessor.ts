import { resolveUrl } from './urlResolver';

export interface AttributeProcessor {
    process(value: string, base: string, resolvedImages?: { [path: string]: string }): string;
}

export class DefaultAttributeProcessor implements AttributeProcessor {
    process(value: string, base: string, resolvedImages?: { [path: string]: string }): string {
        return resolveUrl(value, base, resolvedImages);
    }
}

export class SrcSetAttributeProcessor implements AttributeProcessor {
    process(value: string, base: string, resolvedImages?: { [path: string]: string }): string {
        return value.split(',').map((part: string) => {
            const trimmed = part.trim();
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex === -1) {
                return resolveUrl(trimmed, base, resolvedImages);
            }
            const url = trimmed.slice(0, spaceIndex);
            const descriptor = trimmed.slice(spaceIndex);
            return resolveUrl(url, base, resolvedImages) + descriptor;
        }).join(', ');
    }
}
