import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import styles from './styles.module.css';

// sourceIdごとの初期コード・画像・パスを保存するグローバルストア
const sourceCodeStore = new Map<string, {
    html: string;
    css: string;
    js: string;
    images?: { [path: string]: string };
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}>();

// ストア更新を購読するリスナー
type StoreListener = () => void;
const storeListeners = new Map<string, Set<StoreListener>>();

// ストア更新を通知する関数
const notifyStoreUpdate = (sourceId: string) => {
    const listeners = storeListeners.get(sourceId);
    if (listeners) {
        listeners.forEach(listener => listener());
    }
};

export interface CodePreviewProps {
    /**
     * ファイル構造（エクスプローラ）の初期表示状態
     * trueで初期表示、falseで非表示
     */
    fileStructureVisible?: boolean;
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
    title?: string;
    minHeight?: string;
    imageBasePath?: string;
    /**
     * エディタのテーマ。Docusaurusがない環境でも動くよう、明示的に指定できます。
     * 省略時は 'light'
     */
    theme?: 'light' | 'dark';
    htmlVisible?: boolean;
    cssVisible?: boolean;
    jsVisible?: boolean;
    previewVisible?: boolean;
    consoleVisible?: boolean;
    /**
     * 同じコードを持つ複数の CodePreview を簡単に設置するためのID。
     * 同じ sourceId を持つ CodePreview が複数ある場合、最初のインスタンスの
     * initialHTML/CSS/JS が2つ目以降でも自動的に使われます。
     */
    sourceId?: string;
    /**
     * HTMLファイルのパス（例: "index.html"）
     * デフォルト: "index.html"
     */
    htmlPath?: string;
    /**
     * CSSファイルのパス（例: "css/style.css"）
     * 指定された場合、HTML内で相対パスで参照可能になります
     */
    cssPath?: string;
    /**
     * JavaScriptファイルのパス（例: "js/script.js"）
     * 指定された場合、HTML内で相対パスで参照可能になります
     */
    jsPath?: string;
    /**
     * 画像ファイルのパスとURLのマップ（Docusaurusのstatic/img/〜など）
     * 例: { "img/sample.png": "/img/sample.png" }
     */
    images?: { [path: string]: string };
}

type EditorKey = 'html' | 'css' | 'js';

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

type EditorConfig = {
    key: EditorKey;
    label: string;
    language: 'html' | 'css' | 'javascript';
    value: string;
    onChange: (value: string | undefined) => void;
    onMount: (editor: any) => void;
    visible: boolean;
};

const MIN_EDITOR_WIDTH = 200;
const KEYBOARD_STEP_PERCENT = 5;

export default function CodePreview({
    initialHTML,
    initialCSS,
    initialJS,
    title = '',
    minHeight = '200px',
    imageBasePath,
    theme = 'light',
    htmlVisible,
    cssVisible,
    jsVisible,
    previewVisible,
    consoleVisible,
    sourceId,
    htmlPath = 'index.html',
    cssPath,
    jsPath,
    images,
    fileStructureVisible,
}: CodePreviewProps) {
    let resolvedHTML = initialHTML;
    let resolvedCSS = initialCSS;
    let resolvedJS = initialJS;
    let resolvedImages = images;
    let resolvedHtmlPath = htmlPath;
    let resolvedCssPath = cssPath;
    let resolvedJsPath = jsPath;

    // 各プロパティが明示的に指定されているか個別に判定
    const hasInitialHTML = initialHTML !== undefined;
    const hasInitialCSS = initialCSS !== undefined;
    const hasInitialJS = initialJS !== undefined;

    // このインスタンスが何らかのinitialを提供しているか
    const isSourceProvider = sourceId && (hasInitialHTML || hasInitialCSS || hasInitialJS);

    if (sourceId) {
        // ストアから値を取得し、指定されていないプロパティのみ補完
        const stored = sourceCodeStore.get(sourceId);
        if (stored) {
            if (!hasInitialHTML && stored.html) {
                resolvedHTML = stored.html;
            }
            if (!hasInitialCSS && stored.css) {
                resolvedCSS = stored.css;
            }
            if (!hasInitialJS && stored.js) {
                resolvedJS = stored.js;
            }
            if (!images && stored.images) {
                resolvedImages = stored.images;
            }
            if (!htmlPath && stored.htmlPath) {
                resolvedHtmlPath = stored.htmlPath;
            }
            if (!cssPath && stored.cssPath) {
                resolvedCssPath = stored.cssPath;
            }
            if (!jsPath && stored.jsPath) {
                resolvedJsPath = stored.jsPath;
            }
        }
    }

    // 末尾に改行を追加する関数
    const ensureTrailingNewline = (code: string): string => {
        if (code && !code.endsWith('\n')) {
            return code + '\n';
        }
        return code;
    };

    const [htmlCode, setHtmlCode] = useState(ensureTrailingNewline(resolvedHTML || ''));
    const [cssCode, setCssCode] = useState(ensureTrailingNewline(resolvedCSS || ''));
    const [jsCode, setJsCode] = useState(ensureTrailingNewline(resolvedJS || ''));
    const [editorHeight, setEditorHeight] = useState(minHeight);
    const [previewHeight, setPreviewHeight] = useState(minHeight);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [showLineNumbers, setShowLineNumbers] = useState(false);
    const [showFileStructure, setShowFileStructure] = useState(!!fileStructureVisible);
    const [iframeKey, setIframeKey] = useState(0); // iframeを強制再マウントするためのkey

    // 各セクションの幅を管理するstate
    const [sectionWidths, setSectionWidths] = useState<Record<EditorKey, number>>({ html: 50, css: 50, js: 0 });
    const [isResizing, setIsResizing] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const editorsRowRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const userResizedRef = useRef(false);

    // エディタの参照を保持
    const htmlEditorRef = useRef<any>(null);
    const cssEditorRef = useRef<any>(null);
    const jsEditorRef = useRef<any>(null);

    // 初期状態を保持するref
    const initialStateRef = useRef({
        html: ensureTrailingNewline(resolvedHTML || ''),
        css: ensureTrailingNewline(resolvedCSS || ''),
        js: ensureTrailingNewline(resolvedJS || ''),
    });
    // どのエディタの初期状態を確定済みか（propsで与えられたものは最初から確定）
    const capturedInitialRef = useRef({
        html: !!(sourceId ? hasInitialHTML : true),
        css: !!(sourceId ? hasInitialCSS : true),
        js:  !!(sourceId ? hasInitialJS : true),
    });

    // 長押し用のタイマーref
    const resetTimerRef = useRef<number | null>(null);
    const [resetProgress, setResetProgress] = useState(0); // 0~1
    const resetProgressIntervalRef = useRef<number | null>(null);

    // ストア更新の購読
    useEffect(() => {
        if (!sourceId) return;

        // 初回マウント時にストアから値を取得（指定されていないプロパティのみ）
        const stored = sourceCodeStore.get(sourceId);
        if (stored) {
            if (!hasInitialHTML && stored.html) {
                setHtmlCode(ensureTrailingNewline(stored.html));
                // 初期基準値が未確定なら、ここで確定
                if (!capturedInitialRef.current.html) {
                    initialStateRef.current.html = ensureTrailingNewline(stored.html);
                    capturedInitialRef.current.html = true;
                }
            }
            if (!hasInitialCSS && stored.css) {
                setCssCode(ensureTrailingNewline(stored.css));
                if (!capturedInitialRef.current.css) {
                    initialStateRef.current.css = ensureTrailingNewline(stored.css);
                    capturedInitialRef.current.css = true;
                }
            }
            if (!hasInitialJS && stored.js) {
                setJsCode(ensureTrailingNewline(stored.js));
                if (!capturedInitialRef.current.js) {
                    initialStateRef.current.js = ensureTrailingNewline(stored.js);
                    capturedInitialRef.current.js = true;
                }
            }
        }

        // ストア更新時のリスナー（指定されていないプロパティのみ更新）
        const listener = () => {
            const stored = sourceCodeStore.get(sourceId);
            if (stored) {
                if (!hasInitialHTML && stored.html) {
                    setHtmlCode(ensureTrailingNewline(stored.html));
                    if (!capturedInitialRef.current.html) {
                        initialStateRef.current.html = ensureTrailingNewline(stored.html);
                        capturedInitialRef.current.html = true;
                    }
                }
                if (!hasInitialCSS && stored.css) {
                    setCssCode(ensureTrailingNewline(stored.css));
                    if (!capturedInitialRef.current.css) {
                        initialStateRef.current.css = ensureTrailingNewline(stored.css);
                        capturedInitialRef.current.css = true;
                    }
                }
                if (!hasInitialJS && stored.js) {
                    setJsCode(ensureTrailingNewline(stored.js));
                    if (!capturedInitialRef.current.js) {
                        initialStateRef.current.js = ensureTrailingNewline(stored.js);
                        capturedInitialRef.current.js = true;
                    }
                }
            }
        };

        if (!storeListeners.has(sourceId)) {
            storeListeners.set(sourceId, new Set());
        }
        storeListeners.get(sourceId)!.add(listener);

        return () => {
            storeListeners.get(sourceId)?.delete(listener);
        };
    }, [sourceId, hasInitialHTML, hasInitialCSS, hasInitialJS]);

    const resolveVisibility = (autoVisible: boolean, override?: boolean): boolean => {
        if (typeof override === 'boolean') {
            return override;
        }
        return autoVisible;
    };

    // 各エディタを表示するかどうかを判定
    // resolvedの値を見る（sourceIdでコードを共有する場合も考慮）
    const showHTMLEditor = resolveVisibility(resolvedHTML !== undefined, htmlVisible);
    const showCSSEditor = resolveVisibility(resolvedCSS !== undefined, cssVisible);
    const showJSEditor = resolveVisibility(resolvedJS !== undefined, jsVisible);
    const showPreview = resolveVisibility(showHTMLEditor, previewVisible);
    const showConsole = resolveVisibility(consoleLogs.length > 0, consoleVisible);

    // ソース提供者の場合、initialが変更されたらストアを更新
    useEffect(() => {
        if (sourceId && isSourceProvider) {
            // 既存のストアの値を取得
            const existing = sourceCodeStore.get(sourceId) || { html: '', css: '', js: '', images: undefined, htmlPath: undefined, cssPath: undefined, jsPath: undefined };
            // 指定されたプロパティのみ上書き（マージ）
            const updated = {
                html: hasInitialHTML ? (initialHTML || '') : existing.html,
                css: hasInitialCSS ? (initialCSS || '') : existing.css,
                js: hasInitialJS ? (initialJS || '') : existing.js,
                images: images || existing.images,
                htmlPath: htmlPath || existing.htmlPath,
                cssPath: cssPath || existing.cssPath,
                jsPath: jsPath || existing.jsPath,
            };
            sourceCodeStore.set(sourceId, updated);
            // 他のインスタンスに通知
            notifyStoreUpdate(sourceId);
        }
    }, [sourceId, isSourceProvider, hasInitialHTML, hasInitialCSS, hasInitialJS, initialHTML, initialCSS, initialJS]);

    // エディタの実際のコンテンツ幅を取得する関数
    const getEditorScrollWidth = (editorRef: React.RefObject<any>): number => {
        if (!editorRef.current) return 200;

        try {
            const editor = editorRef.current;
            const domNode = editor.getDomNode();
            if (!domNode) return 200;

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

            return 200; // 取得できない場合は最小幅
        } catch {
            return 200; // エラー時は最小幅
        }
    };

    // エディタセクションの最適な幅を計算する関数（プレビューは下段に配置）
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
            const htmlNeededWidth = Math.max(getEditorScrollWidth(htmlEditorRef), minEditorWidth);
            editors.push({ key: 'html', needed: htmlNeededWidth });
        }

        if (showCSSEditor) {
            const cssNeededWidth = Math.max(getEditorScrollWidth(cssEditorRef), minEditorWidth);
            editors.push({ key: 'css', needed: cssNeededWidth });
        }

        if (showJSEditor) {
            const jsNeededWidth = Math.max(getEditorScrollWidth(jsEditorRef), minEditorWidth);
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

    // 幅を再計算して更新する関数
    const updateSectionWidths = (force = false) => {
        if (!force && userResizedRef.current) {
            return;
        }
        const newWidths = calculateOptimalWidths();
        setSectionWidths(newWidths);
    };

    // エディタの高さを計算する関数
    const calculateEditorHeight = () => {
        const calculateEditorHeightByCode = (code: string): number => {
            if (!code) return parseInt(minHeight);
            const lines = code.split('\n').length;
            const lineHeight = 19; // Monaco editorの行の高さ
            const padding = 22; // 上下のパディング
            return Math.max(lines * lineHeight + padding, parseInt(minHeight));
        };

        const htmlEditorHeight = showHTMLEditor ? calculateEditorHeightByCode(htmlCode) : 0;
        const cssEditorHeight = showCSSEditor ? calculateEditorHeightByCode(cssCode) : 0;
        const jsEditorHeight = showJSEditor ? calculateEditorHeightByCode(jsCode) : 0;

        const maxEditorHeight = Math.max(htmlEditorHeight, cssEditorHeight, jsEditorHeight);
        const finalEditorHeight = Math.max(maxEditorHeight, parseInt(minHeight));
        const limitedEditorHeight = Math.min(finalEditorHeight, 600);

        setEditorHeight(limitedEditorHeight + 'px');
    };

    // プレビューの高さを計算する関数
    const calculatePreviewHeight = () => {
        const iframe = iframeRef.current;
        let pHeight = parseInt(minHeight);

        if (iframe) {
            try {
                const iframeDoc = iframe.contentDocument;
                if (iframeDoc) {
                    const calculatedHeight = Math.max(
                        iframeDoc.body?.scrollHeight || 0,
                        iframeDoc.body?.offsetHeight || 0,
                        iframeDoc.documentElement?.clientHeight || 0,
                        iframeDoc.documentElement?.scrollHeight || 0,
                        iframeDoc.documentElement?.offsetHeight || 0
                    );
                    pHeight = Math.max(pHeight, calculatedHeight);
                }
            } catch {
                // noop
            }
        }

        const finalPreviewHeight = Math.max(pHeight, parseInt(minHeight));
        const limitedPreviewHeight = Math.min(finalPreviewHeight, 800);

        setPreviewHeight(limitedPreviewHeight + 'px');
    };

    const updateEditorHeight = () => {
        setTimeout(() => {
            calculateEditorHeight();
        }, 100);
    };

    const updatePreviewHeight = () => {
        if (!showPreview) return;
        setTimeout(() => {
            calculatePreviewHeight();
        }, 100);
    };

    const toggleLineNumbers = () => {
        setShowLineNumbers(prev => !prev);
    };

    // リセット関数
    const handleReset = () => {
        // 編集したコードを初期状態に戻す
        setHtmlCode(initialStateRef.current.html);
        setCssCode(initialStateRef.current.css);
        setJsCode(initialStateRef.current.js);

        // コンソールログをクリア
        setConsoleLogs([]);

        // iframeを強制的に再マウント
        setIframeKey(prev => prev + 1);

        // プレビューを再レンダリング
        setTimeout(() => {
            updatePreviewHeight();
        }, 100);
    };

    // 長押しハンドラー
    const handleResetMouseDown = () => {
        let start = Date.now();
        setResetProgress(0);
        resetProgressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            setResetProgress(Math.min(elapsed / 500, 1));
        }, 16);
        resetTimerRef.current = window.setTimeout(() => {
            setResetProgress(1);
            handleReset();
            if (resetProgressIntervalRef.current) {
                clearInterval(resetProgressIntervalRef.current);
                resetProgressIntervalRef.current = null;
            }
        }, 500); // 500ミリ秒（0.5秒）の長押し
    };

    const handleResetMouseUp = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current) {
            clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
        setResetProgress(0);
    };

    const handleResetMouseLeave = () => {
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (resetProgressIntervalRef.current) {
            clearInterval(resetProgressIntervalRef.current);
            resetProgressIntervalRef.current = null;
        }
        setResetProgress(0);
    };

    // コンポーネントのアンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
            }
        };
    }, []);

    const computeNewPairPercents = (
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

        newLeftPx = Math.max(newLeftPx, 0);
        newRightPx = Math.max(newRightPx, 0);

        const newLeftPercent = (newLeftPx / containerWidth) * 100;
        const newRightPercent = (newRightPx / containerWidth) * 100;

        return { left: newLeftPercent, right: newRightPercent };
    };

    const handlePointerMove = useCallback(
        (event: MouseEvent) => {
            const state = dragStateRef.current;
            if (!state) {
                return;
            }

            event.preventDefault();

            const deltaPx = event.clientX - state.startX;
            if (deltaPx === 0) {
                return;
            }

            const adjusted = computeNewPairPercents(
                state.containerWidth,
                state.leftWidthPercent,
                state.rightWidthPercent,
                deltaPx
            );

            if (!adjusted) {
                return;
            }

            userResizedRef.current = true;
            setSectionWidths(prev => ({
                ...prev,
                [state.leftKey]: adjusted.left,
                [state.rightKey]: adjusted.right,
            }));

            dragStateRef.current = {
                ...state,
                startX: event.clientX,
                leftWidthPercent: adjusted.left,
                rightWidthPercent: adjusted.right,
            };
        },
        [setSectionWidths]
    );

    const handlePointerUp = useCallback(() => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);

        const state = dragStateRef.current;
        dragStateRef.current = null;

        if (!state) {
            return;
        }

        document.body.style.cursor = state.restoreCursor;
        document.body.style.userSelect = state.restoreUserSelect;
        setIsResizing(false);
    }, [handlePointerMove]);

    const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>, leftKey: EditorKey, rightKey: EditorKey) => {
        if (!editorsRowRef.current) {
            return;
        }

        const containerWidth = editorsRowRef.current.getBoundingClientRect().width;
        if (!containerWidth) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (dragStateRef.current) {
            handlePointerUp();
        }

        dragStateRef.current = {
            startX: event.clientX,
            leftKey,
            rightKey,
            leftWidthPercent: sectionWidths[leftKey] ?? 0,
            rightWidthPercent: sectionWidths[rightKey] ?? 0,
            containerWidth,
            restoreCursor: document.body.style.cursor,
            restoreUserSelect: document.body.style.userSelect,
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        setIsResizing(true);

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', handlePointerUp);
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
        if (!editorsRowRef.current) {
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

        const containerWidth = editorsRowRef.current.getBoundingClientRect().width;
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
    }, [showHTMLEditor, showCSSEditor, showJSEditor]);

    useEffect(() => {
        return () => {
            handlePointerUp();
        };
    }, [handlePointerUp]);

    // リサイズ
    useEffect(() => {
        const handleResize = () => {
            updateSectionWidths();
            updateEditorHeight();
            updatePreviewHeight();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 初回プレビュー高さ調整
    useEffect(() => {
        if (!showPreview) return;
        const iframe = iframeRef.current;
        if (iframe) {
            const handleLoad = () => {
                updatePreviewHeight();
                setTimeout(updatePreviewHeight, 100);
                setTimeout(updatePreviewHeight, 500);
            };

            iframe.addEventListener('load', handleLoad);
            if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                handleLoad();
            }
            return () => iframe.removeEventListener('load', handleLoad);
        }
    }, [showPreview]);

    // コード変更時の高さ調整
    useEffect(() => {
        updateEditorHeight();
        if (showPreview) {
            updatePreviewHeight();
        }
    }, [htmlCode, cssCode, jsCode, minHeight, showPreview]);

    useEffect(() => {
        setConsoleLogs([]);
    }, [jsCode, htmlCode]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframeRef.current?.contentWindow) return;
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (data.type === 'codePreviewConsoleLog' && Array.isArray(data.messages)) {
                setConsoleLogs(data.messages);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // HTML末尾改行保証
    useEffect(() => {
        if (!showHTMLEditor) return;
        if (htmlCode && !htmlCode.endsWith('\n')) {
            const newValue = htmlCode + '\n';
            setHtmlCode(newValue);

            if (htmlEditorRef.current) {
                const editor = htmlEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [htmlCode, showHTMLEditor]);

    // CSS末尾改行保証
    useEffect(() => {
        if (cssCode && !cssCode.endsWith('\n')) {
            const newValue = cssCode + '\n';
            setCssCode(newValue);

            if (cssEditorRef.current) {
                const editor = cssEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [cssCode]);

    // JS末尾改行保証
    useEffect(() => {
        if (jsCode && !jsCode.endsWith('\n')) {
            const newValue = jsCode + '\n';
            setJsCode(newValue);

            if (jsEditorRef.current) {
                const editor = jsEditorRef.current;
                const position = editor.getPosition();
                editor.setValue(newValue);
                if (position) editor.setPosition(position);
            }
        }
    }, [jsCode]);

    // 画像パスを変換する関数（相対パスにベースパスを前置）
    const processImagePaths = (code: string): string => {
        if (!imageBasePath) return code;

        let base = imageBasePath;
        if (!base.endsWith('/')) base += '/';

        return code.replace(/src="([^"]+)"/g, (match, src) => {
            if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
                return match;
            }
            return `src="${base}${src}"`;
        });
    };

    // アンカーリンクをスムーススクロールに変換
    const processAnchorLinks = (code: string): string =>
        code.replace(/href="#([^"]+)"/g, (match, id) => {
            return `href="javascript:void(0)" onclick="document.getElementById('${id}')?.scrollIntoView({behavior: 'smooth'})"`;
        });

    // </script> タグをエスケープする関数
    const escapeScriptEndTag = (code: string): string => {
        return code.replace(/<\/script>/gi, '<' + '/script>');
    };

    // CSS内のurl()をimagesマッピングで置換
    const processCssCode = (code: string): string => {
        if (!resolvedImages) return code;
        return code.replace(/url\((['"]?)([^)'"]+)\1\)/g, (match, quote, path) => {
            // 相対パス正規化（../img/〜, ./img/〜, img/〜 など）
            let norm = path.replace(/^\.\//, '');
            if (norm.startsWith('..')) {
                // 例: ../img/fence.png → img/fence.png
                norm = norm.replace(/^\.\.\//, '');
            }
            if (resolvedImages[norm]) {
                return `url(${quote}${resolvedImages[norm]}${quote})`;
            }
            return match;
        });
    };

    // HTMLコードを処理
    const processHtmlCode = (code: string): string => {
        let processed = processImagePaths(code);
        processed = processAnchorLinks(processed);
        processed = resolveFilePaths(processed);
        return processed;
    };

    // ファイルパスを解決してインライン化
    const resolveFilePaths = (html: string): string => {
        let processed = html;

        // CSSファイルのパスを解決
        if (cssPath && cssCode) {
            // <link href="..." rel="stylesheet"> を検索して置き換え
            const linkRegex = new RegExp(
                `<link\\s+[^>]*href=["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
                'gi'
            );
            processed = processed.replace(linkRegex, () => {
                return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
            });

            // 逆順も対応: rel="stylesheet" href="..."
            const linkRegex2 = new RegExp(
                `<link\\s+[^>]*rel=["']stylesheet["'][^>]*href=["']${cssPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
                'gi'
            );
            processed = processed.replace(linkRegex2, () => {
                return `<style data-from-file="${cssPath}">\n${cssCode}\n</style>`;
            });
        }

        // JavaScriptファイルのパスを解決
        if (jsPath && jsCode) {
            // <script src="..."></script> を検索して置き換え
            const scriptRegex = new RegExp(
                `<script\\s+[^>]*src=["']${jsPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*</script>`,
                'gi'
            );
            processed = processed.replace(scriptRegex, () => {
                return `<script data-from-file="${jsPath}">\n${jsCode}\n</script>`;
            });
        }

        return processed;
    };

    // ファイル構造をツリー形式で生成
    const buildFileStructure = (): { folders: Map<string, string[]>; rootFiles: string[] } => {
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

            const parts = path.split('/');
            if (parts.length === 1) {
                // ルートファイル
                if (!rootFiles.includes(path)) rootFiles.push(path);
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

    // iframeへ渡すHTML
    const generatePreviewDocument = (): string => {
        const processedHtml = escapeScriptEndTag(processHtmlCode(htmlCode));
        const processedCss = processCssCode(cssCode);
        const styleTag = processedCss ? `<style>\n${processedCss}\n</style>` : '';
        const consoleScriptTag = (showPreview || showConsole || showHTMLEditor || showJSEditor)
            ? `<script data-code-preview-internal="true">
(function () {
    if (!window.parent) return;
    const logs = [];
    const MAX_HTML_LENGTH = 300;
                            const INTERNAL_SCRIPT_SELECTOR = 'script[data-code-preview-internal]';

                            const currentScript = document.currentScript;

                            const removeInternalScripts = root => {
                                if (!root || typeof root.querySelectorAll !== 'function') return;
                                try {
                                    const scripts = root.querySelectorAll(INTERNAL_SCRIPT_SELECTOR);
                                    for (let index = 0; index < scripts.length; index++) {
                                        const script = scripts[index];
                                        if (!script || script === currentScript) continue;
                                        if (script.parentNode) {
                                            script.parentNode.removeChild(script);
                                        }
                                    }
                                } catch (error) {
                                    // noop
                                }
                            };

                            const removeCurrentScript = () => {
                                if (currentScript && currentScript.parentNode) {
                                    currentScript.parentNode.removeChild(currentScript);
                                }
                            };

                            removeInternalScripts(document);
                            removeCurrentScript();

    const postLogs = () => {
        try {
            window.parent.postMessage({ type: 'codePreviewConsoleLog', messages: logs.slice() }, '*');
        } catch (error) {
            // noop
        }
    };

    const extractStackLocation = stack => {
        if (!stack) return '';
        try {
            const text = String(stack);
            const jsMatch = text.match(/(code-preview-js\.js:\d+:\d+)/);
            if (jsMatch && jsMatch[1]) return ' (' + jsMatch[1] + ')';
            const htmlMatch = text.match(/(about:srcdoc:\d+:\d+)/);
            if (htmlMatch && htmlMatch[1]) return ' (' + htmlMatch[1] + ')';
        } catch (error) {
            // noop
        }
        return '';
    };

    const truncate = text => {
        if (typeof text !== 'string') return text;
        if (text.length <= MAX_HTML_LENGTH) return text;
        return text.slice(0, MAX_HTML_LENGTH) + '…';
    };

    const describeElement = element => {
        try {
            const tag = element.tagName ? element.tagName.toLowerCase() : 'element';
            const id = element.id ? '#' + element.id : '';
            let classInfo = '';
            if (element.className && typeof element.className === 'string' && element.className.trim()) {
                classInfo = '.' + element.className.trim().split(/\s+/).join('.');
            }
            const summary = '<' + tag + id + classInfo + '>';
            const outer = element.outerHTML;
            if (outer) return truncate(outer);
            return summary;
        } catch (error) {
            return '<要素>';
        }
    };

    const describeNode = node => {
        if (node === null) return 'null';
        if (node === undefined) return 'undefined';

        if (typeof Node !== 'undefined' && node instanceof Node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent || '';
                return 'テキスト("' + truncate(textContent.trim()) + '")';
            }

            if (node.nodeType === Node.COMMENT_NODE) {
                return '<!-- ' + truncate(node.textContent || '') + ' -->';
            }

            if (typeof Element !== 'undefined' && node instanceof Element) {
                return describeElement(node);
            }

            if (typeof Document !== 'undefined' && node instanceof Document) {
                const html = node.documentElement ? node.documentElement.outerHTML || '' : '';
                return html ? truncate(html) : 'ドキュメント';
            }

            if (typeof DocumentFragment !== 'undefined' && node instanceof DocumentFragment) {
                return 'ドキュメントフラグメント';
            }
        }

        return String(node);
    };

    const describeCollection = collection => {
        try {
            return Array.from(collection).map(describeNode).join(', ');
        } catch (error) {
            return String(collection);
        }
    };

    const toMessage = value => {
        try {
            if (value instanceof Error) {
                const location = extractStackLocation(value.stack);
                const message = value.message || String(value);
                return location ? message + location : message;
            }

            if (typeof Node !== 'undefined' && value instanceof Node) {
                return describeNode(value);
            }

            if (typeof NodeList !== 'undefined' && value instanceof NodeList) {
                return '[' + describeCollection(value) + ']';
            }

            if (typeof HTMLCollection !== 'undefined' && value instanceof HTMLCollection) {
                return '[' + describeCollection(value) + ']';
            }

            if (Array.isArray(value)) {
                return '[' + value.map(toMessage).join(', ') + ']';
            }

            if (typeof value === 'string') {
                return value;
            }

            if (typeof value === 'object' && value !== null) {
                const seen = new WeakSet();
                return JSON.stringify(
                    value,
                    (key, innerValue) => {
                        if (typeof innerValue === 'object' && innerValue !== null) {
                            if (seen.has(innerValue)) return '[循環参照]';
                            seen.add(innerValue);
                        }
                        return innerValue;
                    },
                    2
                );
            }

            return String(value);
        } catch (error) {
            return String(value);
        }
    };

    const combineArgs = args => {
        if (!args || !args.length) return '';
        try {
            return args.map(toMessage).join(' ');
        } catch (error) {
            return '';
        }
    };

    const pushLog = message => {
        logs.push(message);
        postLogs();
    };

    const originalLog = console.log.bind(console);
    console.log = (...args) => {
        const message = combineArgs(args);
        pushLog(message);
        return originalLog.apply(console, args);
    };

    const originalError = typeof console.error === 'function' ? console.error.bind(console) : null;
    if (originalError) {
        console.error = (...args) => {
            const message = combineArgs(args);
            pushLog('[エラー] ' + message);
            return originalError.apply(console, args);
        };
    }

    window.addEventListener('error', event => {
        const message = event.message || '不明なエラー';
        const location =
            extractStackLocation(event.error && event.error.stack) ||
            (event.filename ? ' (' + event.filename + ':' + (event.lineno || 0) + ':' + (event.colno || 0) + ')' : '');
        pushLog('[エラー] ' + message + location);
    });

    window.addEventListener('unhandledrejection', event => {
        const reason = event.reason;
        let message = '';
        let location = '';

        if (reason instanceof Error) {
            message = reason.message || String(reason);
            location = extractStackLocation(reason.stack);
        } else if (typeof reason === 'object' && reason !== null) {
            try {
                message = JSON.stringify(reason);
            } catch (error) {
                message = String(reason);
            }
        } else {
            message = String(reason);
        }

        pushLog('[エラー] Promise: ' + message + (location || ''));
    });

        removeInternalScripts(document);
})();
<\/script>`
            : '';

        // 仮想ファイルシステムの初期化スクリプト
        // 画像パスはBlob URLではなく、Docusaurus/staticのURLをそのまま返す
        const imagesMap = images || {};

        // JSON.stringify後に</script>をエスケープする関数
        const jsonStringifyAndEscape = (value: string): string => {
            return JSON.stringify(value).replace(/<\/script>/gi, '<\\/script>');
        };

        const virtualFileSystemScript = `<script data-code-preview-internal="true">
(function () {
    // 仮想ファイルマップを作成
    const virtualFiles = new Map();
    // ファイルを安全にセット
    ${htmlPath ? `virtualFiles.set(${JSON.stringify(htmlPath)}, ${jsonStringifyAndEscape(htmlCode)});` : ''}
    ${cssPath ? `virtualFiles.set(${JSON.stringify(cssPath)}, ${JSON.stringify(cssCode)});` : ''}
    ${jsPath ? `virtualFiles.set(${JSON.stringify(jsPath)}, ${jsonStringifyAndEscape(jsCode)});` : ''}
    // 画像パスも登録（値はURL文字列）
    ${Object.entries(imagesMap).map(([k, v]) => `virtualFiles.set(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('\n    ')}

    // パスを正規化する関数
    function normalizePath(path, baseUrl) {
        try {
            // 絶対URLの場合はそのまま返す
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
                return null;
            }

            // 相対パスを解決
            let resolved = path;
            if (path.startsWith('./')) {
                resolved = path.slice(2);
            } else if (path.startsWith('../')) {
                // 基準パスを取得（htmlPathのディレクトリ）
                const basePath = ${JSON.stringify(htmlPath || '')}.split('/').slice(0, -1).join('/');
                const parts = path.split('/');
                const baseParts = basePath ? basePath.split('/') : [];

                for (let i = 0; i < parts.length; i++) {
                    if (parts[i] === '..') {
                        baseParts.pop();
                    } else if (parts[i] !== '.') {
                        baseParts.push(parts[i]);
                    }
                }
                resolved = baseParts.join('/');
            }

            return resolved;
        } catch (e) {
            return null;
        }
    }

    // オリジナルのfetchを保存
    const originalFetch = window.fetch;

    // fetchをオーバーライド
    window.fetch = function(url, options) {
        const normalizedPath = normalizePath(String(url), document.location.href);

        if (normalizedPath && virtualFiles.has(normalizedPath)) {
            const content = virtualFiles.get(normalizedPath);
            // 画像の場合はリダイレクト的にURLを返す
            if (typeof content === 'string' && (content.startsWith('/img/') || content.startsWith('img/'))) {
                // fetchで画像を取得した場合は実ファイルURLへリダイレクト
                return originalFetch.call(window, content, options);
            }
            // 仮想的なResponseオブジェクトを返す
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({
                    'Content-Type': normalizedPath.endsWith('.css') ? 'text/css' :
                                   normalizedPath.endsWith('.js') ? 'application/javascript' :
                                   normalizedPath.endsWith('.html') ? 'text/html' : 'text/plain'
                }),
                text: () => Promise.resolve(content),
                json: () => Promise.resolve(JSON.parse(content)),
                blob: () => Promise.resolve(new Blob([content])),
                arrayBuffer: () => Promise.resolve(new TextEncoder().encode(content).buffer),
                clone: function() { return this; }
            });
        }

        return originalFetch.call(window, url, options);
    };

    // <img>やCSSのurl()参照も仮想パス→実URLに置換する
    const origCreateElement = document.createElement;
    document.createElement = function(tagName, ...args) {
        const el = origCreateElement.call(document, tagName, ...args);
        if (tagName.toLowerCase() === 'img') {
            Object.defineProperty(el, 'src', {
                set(v) {
                    const norm = normalizePath(String(v), document.location.href);
                    if (norm && virtualFiles.has(norm)) {
                        const content = virtualFiles.get(norm);
                        if (typeof content === 'string' && (content.startsWith('/img/') || content.startsWith('img/'))) {
                            el.setAttribute('src', content);
                            return;
                        }
                    }
                    el.setAttribute('src', v);
                },
                get() { return el.getAttribute('src'); },
                configurable: true
            });
        }
        return el;
    };

    // グローバルに公開（デバッグ用）
    window.__virtualFiles__ = virtualFiles;
})();
<\/script>`;

        // jsCodeを<script>タグ内に直接埋め込む（</script>エスケープ）
        const scriptTag = jsCode
            ? `<script data-code-preview-internal="true">\n${escapeScriptEndTag(jsCode)}\n<\/script>`
            : '';

        if (processedHtml.includes('<!DOCTYPE') || processedHtml.includes('<html')) {
            let doc = processedHtml;
            if (consoleScriptTag) {
                if (/<head[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<head([^>]*)>/i, `<head$1>${consoleScriptTag}`);
                } else if (/<html[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<html([^>]*)>/i, `<html$1><head>${consoleScriptTag}</head>`);
                } else {
                    doc = `${consoleScriptTag}${doc}`;
                }
            }
            // 仮想ファイルシステムスクリプトを挿入
            if (virtualFileSystemScript) {
                if (/<head[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<head([^>]*)>/i, `<head$1>${virtualFileSystemScript}`);
                } else if (/<html[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<html([^>]*)>/i, `<html$1><head>${virtualFileSystemScript}</head>`);
                } else {
                    doc = `${virtualFileSystemScript}${doc}`;
                }
            }
            if (styleTag) {
                if (/<head[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<\/head>/i, `${styleTag}</head>`);
                } else if (/<html[^>]*>/i.test(doc)) {
                    doc = doc.replace(/<html([^>]*)>/i, `<html$1><head>${styleTag}</head>`);
                } else {
                    doc = `${styleTag}${doc}`;
                }
            }
            if (scriptTag) {
                if (/<\/body>/.test(doc)) {
                    doc = doc.replace(/<\/body>/, `${scriptTag}\n</body>`);
                } else {
                    doc += `\n${scriptTag}`;
                }
            }
            return doc;
        }

        return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>プレビュー</title>
    ${styleTag}
    ${consoleScriptTag}
    ${virtualFileSystemScript}
</head>
<body>
  ${processedHtml}
  ${scriptTag}
</body>
</html>`;
    };

    const handleHtmlChange = (value: string | undefined) => setHtmlCode(value || '');
    const handleCssChange = (value: string | undefined) => setCssCode(value || '');
    const handleJsChange = (value: string | undefined) => setJsCode(value || '');

    const handleHtmlEditorDidMount = (editor: any) => {
        htmlEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

    const handleCssEditorDidMount = (editor: any) => {
        cssEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

    const handleJsEditorDidMount = (editor: any) => {
        jsEditorRef.current = editor;
        setTimeout(updateSectionWidths, 100);
        editor.onDidChangeModelContent(() => setTimeout(updateSectionWidths, 50));
    };

    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    const editorConfigs: EditorConfig[] = [
        {
            key: 'html',
            label: 'HTML',
            language: 'html',
            value: htmlCode,
            onChange: handleHtmlChange,
            onMount: handleHtmlEditorDidMount,
            visible: showHTMLEditor,
        },
        {
            key: 'css',
            label: 'CSS',
            language: 'css',
            value: cssCode,
            onChange: handleCssChange,
            onMount: handleCssEditorDidMount,
            visible: showCSSEditor,
        },
        {
            key: 'js',
            label: 'JavaScript',
            language: 'javascript',
            value: jsCode,
            onChange: handleJsChange,
            onMount: handleJsEditorDidMount,
            visible: showJSEditor,
        },
    ];

    const visibleEditorConfigs = editorConfigs.filter(config => config.visible);
    const editorsRowClassName = isResizing ? `${styles.editorsRow} ${styles.isResizing}` : styles.editorsRow;

    const splitLayoutStyle: React.CSSProperties | undefined = showPreview ? undefined : { minHeight: 'auto' };
    const editorsRowStyle: React.CSSProperties | undefined = showPreview || showConsole ? undefined : { borderBottom: 'none' };

    const renderPreviewIframe = (visible: boolean): React.ReactElement => (
        <iframe
            key={`${visible ? 'visible' : 'hidden'}-${iframeKey}`}
            ref={iframeRef}
            srcDoc={generatePreviewDocument()}
            className={visible ? styles.preview : undefined}
            title="HTML+CSS Preview"
            sandbox="allow-scripts allow-same-origin"
            style={
                visible
                    ? ({ height: previewHeight, '--min-height': minHeight } as React.CSSProperties)
                    : ({ display: 'none' } as React.CSSProperties)
            }
        />
    );

    return (
        <div className={styles.codePreviewContainer}>
            {title ? (
                <div className={styles.header}>
                    <h4 className={styles.title}>{title}</h4>
                </div>
            ) : null}

            <div className={styles.splitLayout} ref={containerRef} style={splitLayoutStyle}>
                {/* ファイル構造の表示 */}
                {showFileStructure && (
                    <div className={styles.fileStructure}>
                        <div className={styles.fileStructureTitle}>📁 ファイル構造</div>
                        <div className={styles.fileTree}>
                            {(() => {
                                const { folders, rootFiles } = buildFileStructure();
                                return (
                                    <>
                                        {rootFiles.map(file => (
                                            <div key={file} className={styles.fileTreeItem}>
                                                <span className={styles.fileIcon}>📄</span> {file}
                                            </div>
                                        ))}
                                        {Array.from(folders.entries()).map(([folderPath, files]) => (
                                            <div key={folderPath} className={styles.fileTreeFolder}>
                                                <div className={styles.fileTreeItem}>
                                                    <span className={styles.folderIcon}>📁</span> {folderPath}
                                                </div>
                                                {files.map(file => (
                                                    <div key={`${folderPath}/${file}`} className={styles.fileTreeSubItem}>
                                                        <span className={styles.fileIcon}>📄</span> {file}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* エディタセクション（上段） */}
                <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onMouseDown={handleResetMouseDown}
                        onMouseUp={handleResetMouseUp}
                        onMouseLeave={handleResetMouseLeave}
                        onTouchStart={handleResetMouseDown}
                        onTouchEnd={handleResetMouseUp}
                        title="長押しでリセット"
                    >
                        <span
                            className={
                                styles.resetProgressCircle +
                                (resetProgress > 0 ? ' ' + styles.isCharging : '')
                            }
                            aria-hidden="true"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                {/* チャージ進行度（細め・進行時のみ） */}
                                {resetProgress > 0 && (
                                    <circle
                                        cx="12" cy="12" r="10"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 10}
                                        strokeDashoffset={(1 - resetProgress) * 2 * Math.PI * 10}
                                        style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                                    />
                                )}
                                {/* 中央のリロード（リセット）アイコン */}
                                <g>
                                    <path
                                        d="M12 5a7 7 0 1 1-5.3 2.7"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <polyline
                                        points="6.5,7.5 6.5,4.5 9.5,4.5"
                                        fill="none"
                                        stroke="#218bff"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </g>
                            </svg>
                        </span>
                        <span className={styles.hiddenText}>長押しでリセット</span>
                    </button>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onClick={toggleLineNumbers}
                        aria-pressed={showLineNumbers}
                        title={showLineNumbers ? '行番号を隠す' : '行番号を表示'}
                    >
                        <span aria-hidden="true">#</span>
                        <span className={styles.hiddenText}>{showLineNumbers ? '行番号を隠す' : '行番号を表示'}</span>
                    </button>
                    <button
                        type="button"
                        className={styles.gyoButton}
                        onClick={() => setShowFileStructure(prev => !prev)}
                        aria-pressed={showFileStructure}
                        title={showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}
                    >
                        <span aria-hidden="true">📁</span>
                        <span className={styles.hiddenText}>{showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}</span>
                    </button>

                    {visibleEditorConfigs.map((config, index) => {
                        const nextConfig = visibleEditorConfigs[index + 1];

                        return (
                            <React.Fragment key={config.key}>
                                <div className={styles.editorSection} style={{ width: `${sectionWidths[config.key]}%` }}>
                                    <div className={styles.sectionHeader}>{config.label}</div>
                                    <div className={styles.editorContainer}>
                                        <Editor
                                            height={editorHeight}
                                            defaultLanguage={config.language}
                                            value={config.value}
                                            onChange={config.onChange}
                                            onMount={config.onMount}
                                            theme={editorTheme}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                lineNumbers: showLineNumbers ? 'on' : 'off',
                                                folding: false,
                                                padding: { top: 5, bottom: 5 },
                                                roundedSelection: false,
                                                wordWrap: 'off',
                                                tabSize: 2,
                                                insertSpaces: true,
                                                scrollBeyondLastLine: false,
                                            }}
                                        />
                                    </div>
                                </div>
                                {nextConfig ? (
                                    <div
                                        className={styles.resizer}
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label={`${config.label} と ${nextConfig.label} の幅を調整`}
                                        tabIndex={0}
                                        onMouseDown={event => handleResizeStart(event, config.key, nextConfig.key)}
                                        onKeyDown={event => handleResizerKeyDown(event, config.key, nextConfig.key)}
                                        onDoubleClick={event => {
                                            event.preventDefault();
                                            resetSectionWidthsToAuto();
                                        }}
                                    >
                                        <span className={styles.resizerGrip} />
                                    </div>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* プレビュー（下段） */}
                {showPreview ? (
                    <div className={styles.previewSection}>
                        <div className={styles.sectionHeader}>プレビュー</div>
                        <div className={styles.previewContainer}>
                            {renderPreviewIframe(true)}
                        </div>
                    </div>
                ) : (
                    (showHTMLEditor || showCSSEditor || showJSEditor || showConsole) && (
                        <div style={{ display: 'none' }}>{renderPreviewIframe(false)}</div>
                    )
                )}
                {showConsole && (
                    <div className={styles.consoleSection}>
                        <div className={styles.sectionHeader}>コンソール</div>
                        <div className={styles.consoleContainer}>
                            {consoleLogs.length === 0 ? (
                                <div className={styles.consolePlaceholder}>ここに console.log の結果が表示されます</div>
                            ) : (
                                consoleLogs.map((log, index) => (
                                    <div key={index} className={styles.consoleLine}>
                                        <span className={styles.consoleBullet}>▶</span>
                                        <span>{log}</span>
                                    </div>
                                ))
                            )
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
