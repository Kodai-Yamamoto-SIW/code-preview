import { useState, useRef, useCallback, useEffect } from 'react';
import type { editor } from 'monaco-editor';
import { getEditorScrollWidth, computeNewPairPercents, MIN_EDITOR_WIDTH } from '../utils/resizeUtils';

export type EditorKey = 'html' | 'css' | 'js';

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

interface UseEditorResizeProps {
    showHTMLEditor: boolean;
    showCSSEditor: boolean;
    showJSEditor: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;
    htmlEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    cssEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    jsEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
}


const KEYBOARD_STEP_PERCENT = 5;

export const useEditorResize = ({
    showHTMLEditor,
    showCSSEditor,
    showJSEditor,
    containerRef,
    htmlEditorRef,
    cssEditorRef,
    jsEditorRef
}: UseEditorResizeProps) => {
    const [sectionWidths, setSectionWidths] = useState<Record<EditorKey, number>>({ html: 50, css: 50, js: 0 });
    const [isResizing, setIsResizing] = useState(false);

    const dragStateRef = useRef<DragState | null>(null);
    const userResizedRef = useRef(false);

    const calculateOptimalWidths = (): { html: number; css: number; js: number } => {
        const container = containerRef.current;
        if (!container) {
            if (showCSSEditor && showJSEditor) return { html: 34, css: 33, js: 33 };
            if (showCSSEditor) return { html: 50, css: 50, js: 0 };
            if (showJSEditor) return { html: 50, css: 0, js: 50 };
            return { html: 100, css: 0, js: 0 };
        }

        const editors: Array<{ key: EditorKey; needed: number }> = [];
        const minEditorWidth = MIN_EDITOR_WIDTH;
        const containerWidth = container.offsetWidth || 800; // フォールバック値

        if (showHTMLEditor) {
            const htmlNeededWidth = Math.max(getEditorScrollWidth(htmlEditorRef.current), minEditorWidth);
            editors.push({ key: 'html', needed: htmlNeededWidth });
        }

        if (showCSSEditor) {
            const cssNeededWidth = Math.max(getEditorScrollWidth(cssEditorRef.current), minEditorWidth);
            editors.push({ key: 'css', needed: cssNeededWidth });
        }

        if (showJSEditor) {
            const jsNeededWidth = Math.max(getEditorScrollWidth(jsEditorRef.current), minEditorWidth);
            editors.push({ key: 'js', needed: jsNeededWidth });
        }

        const totalNeededWidth = editors.reduce((sum, e) => sum + e.needed, 0);

        if (totalNeededWidth > containerWidth) {
            const remainingWidth = containerWidth - minEditorWidth * editors.length;

            if (remainingWidth <= 0) {
                if (editors.length === 3) return { html: 34, css: 33, js: 33 };
                if (editors.length === 2) {
                    // 2つのときは均等
                    if (showHTMLEditor && showCSSEditor) return { html: 50, css: 50, js: 0 };
                    if (showHTMLEditor && showJSEditor) return { html: 50, css: 0, js: 50 };
                    // CSS + JS
                    return { html: 0, css: 50, js: 50 };
                }
                return { html: 100, css: 0, js: 0 };
            }

            const widthsPx: Record<EditorKey, number> = { html: 0, css: 0, js: 0 };
            editors.forEach(e => {
                const ratio = e.needed / totalNeededWidth;
                widthsPx[e.key] = minEditorWidth + remainingWidth * ratio;
            });

            return {
                html: (widthsPx.html / containerWidth) * 100,
                css: (widthsPx.css / containerWidth) * 100,
                js: (widthsPx.js / containerWidth) * 100,
            };
        } else {
            const widths: Record<EditorKey, number> = { html: 0, css: 0, js: 0 };
            editors.forEach(e => {
                widths[e.key] = (e.needed / totalNeededWidth) * 100;
            });
            return widths;
        }
    };

    const updateSectionWidths = useCallback((force = false) => {
        if (!force && userResizedRef.current) {
            return;
        }
        const newWidths = calculateOptimalWidths();
        setSectionWidths(newWidths);
    }, [showHTMLEditor, showCSSEditor, showJSEditor]);

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
    }, [showHTMLEditor, showCSSEditor, showJSEditor, updateSectionWidths]);

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
