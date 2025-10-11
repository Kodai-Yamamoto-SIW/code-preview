import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import styles from './styles.module.css';

export interface CodePreviewProps {
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
}: CodePreviewProps): React.ReactElement {
    // 末尾に改行を追加する関数
    const ensureTrailingNewline = (code: string): string => {
        if (code && !code.endsWith('\n')) {
            return code + '\n';
        }
        return code;
    };

    const [htmlCode, setHtmlCode] = useState(ensureTrailingNewline(initialHTML || ''));
    const [cssCode, setCssCode] = useState(ensureTrailingNewline(initialCSS || ''));
    const [jsCode, setJsCode] = useState(ensureTrailingNewline(initialJS || ''));
    const [editorHeight, setEditorHeight] = useState(minHeight);
    const [previewHeight, setPreviewHeight] = useState(minHeight);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [showLineNumbers, setShowLineNumbers] = useState(false);

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

    const resolveVisibility = (autoVisible: boolean, override?: boolean): boolean => {
        if (typeof override === 'boolean') {
            return override;
        }
        return autoVisible;
    };

    // 各エディタを表示するかどうかを判定
    const showHTMLEditor = resolveVisibility(initialHTML !== undefined, htmlVisible);
    const showCSSEditor = resolveVisibility(initialCSS !== undefined, cssVisible);
    const showJSEditor = resolveVisibility(initialJS !== undefined, jsVisible);
    const showPreview = resolveVisibility(showHTMLEditor, previewVisible);
    const showConsole = resolveVisibility(consoleLogs.length > 0, consoleVisible);

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

    // HTMLコードを処理
    const processHtmlCode = (code: string): string => {
        let processed = processImagePaths(code);
        processed = processAnchorLinks(processed);
        return processed;
    };

    // iframeへ渡すHTML
    const generatePreviewDocument = (): string => {
        const processedHtml = processHtmlCode(htmlCode);
        const styleTag = cssCode ? `<style>\n${cssCode}\n</style>` : '';
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
        const scriptTag = jsCode
            ? `<script data-code-preview-internal="true">
(function () {
    const currentScript = document.currentScript;
                    if (currentScript && currentScript.parentNode) {
                        currentScript.parentNode.removeChild(currentScript);
                    }
                    try {
                        window.eval(${JSON.stringify(`${jsCode}
                //# sourceURL=code-preview-js.js`)});
                    } finally {
                        if (currentScript && currentScript.parentNode) {
                            currentScript.parentNode.removeChild(currentScript);
                        }
    }
})();
<\/script>`
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
            key={visible ? 'code-preview-visible' : 'code-preview-hidden'}
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
                {/* エディタセクション（上段） */}
                <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
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
                        <div className={styles.previewContainer} style={{ '--min-height': minHeight } as React.CSSProperties}>
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
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
