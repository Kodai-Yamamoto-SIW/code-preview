import { useState, useRef, useCallback, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import { getEditorScrollWidth, computeNewPairPercents, calculateOptimalEditorWidths, MIN_EDITOR_WIDTH } from '../utils/resizeUtils';

type DragState<K extends string> = {
    startX: number;
    leftKey: K;
    rightKey: K;
    leftWidthPercent: number;
    rightWidthPercent: number;
    containerWidth: number;
    restoreCursor: string;
    restoreUserSelect: string;
};

export interface ResizeTarget<K extends string> {
    key: K;
    ref: React.RefObject<editor.IStandaloneCodeEditor | null>;
}

interface UseEditorResizeProps<K extends string> {
    resizeTargets: ResizeTarget<K>[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    initialWidths?: Record<K, number>;
}

const KEYBOARD_STEP_PERCENT = 5;

export const useEditorResize = <K extends string>({
    resizeTargets,
    containerRef,
    initialWidths
}: UseEditorResizeProps<K>) => {
    const [sectionWidths, setSectionWidths] = useState<Record<K, number>>(() => {
        if (initialWidths) return initialWidths;
        const widths = {} as Record<K, number>;
        const count = resizeTargets.length;
        if (count > 0) {
            const width = 100 / count;
            resizeTargets.forEach(t => widths[t.key] = width);
        }
        return widths;
    });
    const [isResizing, setIsResizing] = useState(false);

    const dragStateRef = useRef<DragState<K> | null>(null);
    const userResizedRef = useRef(false);

    const calculateOptimalWidths = (): Record<K, number> => {
        const container = containerRef.current;
        const containerWidth = container?.offsetWidth || 800; // フォールバック値

        const editors: Array<{ key: K; needed: number }> = [];
        const minEditorWidth = MIN_EDITOR_WIDTH;

        resizeTargets.forEach(target => {
            const htmlNeededWidth = Math.max(getEditorScrollWidth(target.ref.current), minEditorWidth);
            editors.push({ key: target.key, needed: htmlNeededWidth });
        });

        return calculateOptimalEditorWidths(containerWidth, editors);
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

    const handleMouseDown = (e: React.MouseEvent, leftKey: K, rightKey: K) => {
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

    const resetSectionWidthsToAuto = useCallback(() => {
        userResizedRef.current = false;
        updateSectionWidths(true);
    }, [updateSectionWidths]);

    const handleResizerKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
        leftKey: K,
        rightKey: K
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
