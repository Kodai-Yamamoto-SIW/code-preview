import { editor } from 'monaco-editor';
import { EditorKey } from '../types';

export const MIN_EDITOR_WIDTH = 200;

/**
 * エディタのコンテンツ幅を取得します。
 * Monaco EditorのDOM構造に依存しているため、仕様変更に弱い可能性があります。
 */
export const getEditorScrollWidth = (editorInstance: editor.IStandaloneCodeEditor | null): number => {
    if (!editorInstance) return MIN_EDITOR_WIDTH;

    try {
        const domNode = editorInstance.getDomNode();
        if (!domNode) return MIN_EDITOR_WIDTH;

        const cursorTextElement = domNode.querySelector('.monaco-mouse-cursor-text') as HTMLElement;
        if (cursorTextElement) {
            const viewLines = cursorTextElement.querySelectorAll('.view-line');
            let maxSpanWidth = 0;

            for (let i = 0; i < viewLines.length; i++) {
                const viewLine = viewLines[i] as HTMLElement;
                const span = viewLine.querySelector('span');

                if (span) {
                    const spanStyle = window.getComputedStyle(span);
                    const spanWidth = parseFloat(spanStyle.width) || 0;
                    maxSpanWidth = Math.max(maxSpanWidth, spanWidth);
                }
            }

            if (maxSpanWidth > 0) {
                return maxSpanWidth + 10 + 25; // 左右の余白を考慮
            }
        }

        return MIN_EDITOR_WIDTH;
    } catch {
        return MIN_EDITOR_WIDTH; // エラー時は最小幅
    }
};

/**
 * コンテナ幅と各エディタの必要幅に基づいて、最適な幅（％）を計算します。
 */
export const calculateOptimalEditorWidths = (
    containerWidth: number,
    editorNeeds: Array<{ key: EditorKey; needed: number }>
): Record<EditorKey, number> => {
    const resultWidths: Record<EditorKey, number> = { html: 0, css: 0, js: 0 };
    const count = editorNeeds.length;

    if (count === 0) {
        return { html: 100, css: 0, js: 0 };
    }

    if (containerWidth <= 0) {
        const width = 100 / count;
        editorNeeds.forEach(e => resultWidths[e.key] = width);
        return resultWidths;
    }

    const minEditorWidth = MIN_EDITOR_WIDTH;
    const totalNeededWidth = editorNeeds.reduce((sum, e) => sum + e.needed, 0);

    if (totalNeededWidth > containerWidth) {
        const remainingWidth = containerWidth - minEditorWidth * count;

        if (remainingWidth <= 0) {
            // スペース不足の場合は均等割り
            const width = 100 / count;
            editorNeeds.forEach(e => resultWidths[e.key] = width);
            return resultWidths;
        }

        const widthsPx: Record<string, number> = {};
        editorNeeds.forEach(e => {
            const ratio = e.needed / totalNeededWidth;
            widthsPx[e.key] = minEditorWidth + remainingWidth * ratio;
        });

        editorNeeds.forEach(e => {
            resultWidths[e.key] = (widthsPx[e.key] / containerWidth) * 100;
        });
    } else {
        editorNeeds.forEach(e => {
            resultWidths[e.key] = (e.needed / totalNeededWidth) * 100;
        });
    }

    return resultWidths;
};

/**
 * リサイズ時の新しい幅（％）を計算します。
 */
export const computeNewPairPercents = (
    containerWidth: number,
    leftPercent: number,
    rightPercent: number,
    deltaPx: number
): { left: number; right: number } | null => {
    if (!containerWidth) {
        return null;
    }

    const leftPx = (leftPercent / 100) * containerWidth;
    const rightPx = (rightPercent / 100) * containerWidth;
    const totalPx = leftPx + rightPx;

    if (!Number.isFinite(totalPx) || totalPx <= 0) {
        return null;
    }

    let newLeftPx = leftPx + deltaPx;
    let newRightPx = rightPx - deltaPx;

    const effectiveMin = Math.min(MIN_EDITOR_WIDTH, totalPx / 2);

    if (newLeftPx < effectiveMin) {
        newLeftPx = effectiveMin;
        newRightPx = totalPx - newLeftPx;
    } else if (newRightPx < effectiveMin) {
        newRightPx = effectiveMin;
        newLeftPx = totalPx - newRightPx;
    }

    return {
        left: (newLeftPx / containerWidth) * 100,
        right: (newRightPx / containerWidth) * 100,
    };
};
