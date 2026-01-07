import type { MinHeightValue } from '../types';

const DEFAULT_MIN_HEIGHT_PX = 200;

const isPositiveNumber = (value: number) => Number.isFinite(value) && value > 0;

const parseMinHeightPx = (value: MinHeightValue | undefined): number | null => {
    if (typeof value === 'number') {
        return isPositiveNumber(value) ? value : null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)px$/i);
        if (pxMatch) {
            const parsed = Number(pxMatch[1]);
            return isPositiveNumber(parsed) ? parsed : null;
        }
        const asNumber = Number(trimmed);
        return isPositiveNumber(asNumber) ? asNumber : null;
    }
    return null;
};

export const normalizeMinHeight = (
    value: MinHeightValue | undefined,
    fallbackPx = DEFAULT_MIN_HEIGHT_PX
) => {
    const parsed = parseMinHeightPx(value);
    const resolvedPx = parsed ?? fallbackPx;

    if (parsed === null && value !== undefined) {
        // eslint-disable-next-line no-console
        console.error(
            `[CodePreview] Invalid minHeight "${String(value)}". ` +
            'Use a positive number (px) or a "NNpx" string.'
        );
    }

    return {
        px: resolvedPx,
        css: `${resolvedPx}px`
    };
};
