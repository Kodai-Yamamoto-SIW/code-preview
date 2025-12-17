import { useState, useRef, useCallback, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import { getEditorScrollWidth, computeNewPairPercents, MIN_EDITOR_WIDTH } from '../utils/resizeUtils';

import { EditorKey } from '../types';

type DragState = {
    startX: number;
    leftKey: EditorKey;
    rightKey: EditorKey;
    leftWidthPercent: number;
    rightWidthPercent: number;
    containerWidth: number;
    restoreCursor: string;
    restoreUserSelect: string;
};

export interface ResizeTarget {
    key: EditorKey;
    ref: React.RefObject<editor.IStandaloneCodeEditor | null>;
}

interface UseEditorResizeProps {
    resizeTargets: ResizeTarget[];
    containerRef: React.RefObject<HTMLDivElement | null>;
}


const KEYBOARD_STEP_PERCENT = 5;

export const useEditorResize = ({
    resizeTargets,
    containerRef
}: UseEditorResizeProps) => {
    const [sectionWidths, setSectionWidths] = useState<Record<EditorKey, number>>({ html: 50, css: 50, js: 0 });
    const [isResizing, setIsResizing] = useState(false);

    const dragStateRef = useRef<DragState | null>(null);
    const userResizedRef = useRef(false);

    const calculateOptimalWidths = (): Record<EditorKey, number> => {
        const container = containerRef.current;
        // 結果の初期化（全て0）
        const resultWidths: Record<EditorKey, number> = { html: 0, css: 0, js: 0 };

        // ターゲットがない場合はhtml: 100とする（または適当なデフォルト）
        if (resizeTargets.length === 0) {
            return { html: 100, css: 0, js: 0 };
        }

        if (!container) {
            // コンテナがない場合は単純に均等割り
            const width = 100 / resizeTargets.length;
            resizeTargets.forEach(t => {
                resultWidths[t.key] = width;
            });
            return resultWidths;
        }

        const editors: Array<{ key: EditorKey; needed: number }> = [];
        const minEditorWidth = MIN_EDITOR_WIDTH;
        const containerWidth = container.offsetWidth || 800; // フォールバック値

        resizeTargets.forEach(target => {
            const htmlNeededWidth = Math.max(getEditorScrollWidth(target.ref.current), minEditorWidth);
            editors.push({ key: target.key, needed: htmlNeededWidth });
        });

        const totalNeededWidth = editors.reduce((sum, e) => sum + e.needed, 0);

        if (totalNeededWidth > containerWidth) {
            const remainingWidth = containerWidth - minEditorWidth * editors.length;

            if (remainingWidth <= 0) {
                // スペース不足の場合は均等割り
                const width = 100 / resizeTargets.length;
                resizeTargets.forEach(t => {
                    resultWidths[t.key] = width;
                });
                return resultWidths;
            }

            const widthsPx: Record<string, number> = {};
            editors.forEach(e => {
                const ratio = e.needed / totalNeededWidth;
                widthsPx[e.key] = minEditorWidth + remainingWidth * ratio;
            });

            const finalWidths = { ...resultWidths };
            editors.forEach(e => {
                finalWidths[e.key] = (widthsPx[e.key] / containerWidth) * 100;
            });
            return finalWidths;
        } else {
            const finalWidths = { ...resultWidths };
            editors.forEach(e => {
                finalWidths[e.key] = (e.needed / totalNeededWidth) * 100;
            });
            return finalWidths;
        }
    };

    const updateSectionWidths = useCallback((force = false) => {
        if (!force && userResizedRef.current) {
            return;
        }
        const newWidths = calculateOptimalWidths();
        setSectionWidths(newWidths);
    }, [resizeTargets]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragStateRef.current) return;

        const { startX, leftKey, rightKey, leftWidthPercent, rightWidthPercent, containerWidth } = dragStateRef.current;
        const deltaPx = e.clientX - startX;

        const result = computeNewPairPercents(containerWidth, leftWidthPercent, rightWidthPercent, deltaPx);

        if (result) {
            setSectionWidths(prev => ({
                ...prev,
                [leftKey]: result.left,
                [rightKey]: result.right,
            }));
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        if (dragStateRef.current) {
            document.body.style.cursor = dragStateRef.current.restoreCursor;
            document.body.style.userSelect = dragStateRef.current.restoreUserSelect;
            dragStateRef.current = null;
            setIsResizing(false);
            userResizedRef.current = true;
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent, leftKey: EditorKey, rightKey: EditorKey) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const containerWidth = containerRef.current.offsetWidth;
        const leftWidthPercent = sectionWidths[leftKey];
        const rightWidthPercent = sectionWidths[rightKey];

        dragStateRef.current = {
            startX: e.clientX,
            leftKey,
            rightKey,
            leftWidthPercent,
            rightWidthPercent,
            containerWidth,
            restoreCursor: document.body.style.cursor,
            restoreUserSelect: document.body.style.userSelect,
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        setIsResizing(true);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const resetSectionWidthsToAuto = () => {
        userResizedRef.current = false;
        updateSectionWidths(true);
    };

    const handleResizerKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        leftKey: EditorKey,
        rightKey: EditorKey
    ) => {
        if (!containerRef.current) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            resetSectionWidthsToAuto();
            return;
        }

        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
            return;
        }

        const containerWidth = containerRef.current.getBoundingClientRect().width;
        if (!containerWidth) {
            return;
        }

        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const deltaPx = (KEYBOARD_STEP_PERCENT / 100) * containerWidth * direction;

        const adjusted = computeNewPairPercents(
            containerWidth,
            sectionWidths[leftKey] ?? 0,
            sectionWidths[rightKey] ?? 0,
            deltaPx
        );

        if (!adjusted) {
            return;
        }

        userResizedRef.current = true;
        setSectionWidths(prev => ({
            ...prev,
            [leftKey]: adjusted.left,
            [rightKey]: adjusted.right,
        }));

        event.preventDefault();
    };

    useEffect(() => {
        userResizedRef.current = false;
        updateSectionWidths(true);
    }, [resizeTargets, updateSectionWidths]);

    useEffect(() => {
        const handleResize = () => {
            updateSectionWidths();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateSectionWidths]);

    return {
        sectionWidths,
        isResizing,
        handleMouseDown,
        handleResizerKeyDown,
        updateSectionWidths,
        resetSectionWidthsToAuto
    };
};
