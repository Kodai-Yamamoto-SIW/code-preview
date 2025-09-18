import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import styles from './styles.module.css';

export interface CodePreviewProps {
    initialCode?: string;
    initialCSS?: string;
    title?: string;
    minHeight?: string;
    imageBasePath?: string;
    /**
     * エディタのテーマ。Docusaurusがない環境でも動くよう、明示的に指定できます。
     * 省略時は 'light'
     */
    theme?: 'light' | 'dark';
}

export default function CodePreview({
    initialCode = '',
    initialCSS,
    title = '',
    minHeight = '200px',
    imageBasePath,
    theme = 'light',
}: CodePreviewProps): React.ReactElement {
    // 末尾に改行を追加する関数
    const ensureTrailingNewline = (code: string): string => {
        if (code && !code.endsWith('\n')) {
            return code + '\n';
        }
        return code;
    };

    const [htmlCode, setHtmlCode] = useState(ensureTrailingNewline(initialCode));
    const [cssCode, setCssCode] = useState(ensureTrailingNewline(initialCSS || ''));
    const [editorHeight, setEditorHeight] = useState(minHeight);
    const [previewHeight, setPreviewHeight] = useState(minHeight);

    // 各セクションの幅を管理するstate
    const [sectionWidths, setSectionWidths] = useState<{ html: number; css: number }>({ html: 50, css: 50 });

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // エディタの参照を保持
    const htmlEditorRef = useRef<any>(null);
    const cssEditorRef = useRef<any>(null);

    // CSSエディタを表示するかどうかを判定
    const showCSSEditor = initialCSS !== undefined;

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
    const calculateOptimalWidths = (): { html: number; css: number } => {
        const container = containerRef.current;
        if (!container) {
            return showCSSEditor ? { html: 50, css: 50 } : { html: 100, css: 0 };
        }

        if (!showCSSEditor) {
            return { html: 100, css: 0 };
        }

        const containerWidth = container.offsetWidth || 800; // フォールバック値

        const minEditorWidth = 200;
        const htmlNeededWidth = Math.max(getEditorScrollWidth(htmlEditorRef), minEditorWidth);
        const cssNeededWidth = Math.max(getEditorScrollWidth(cssEditorRef), minEditorWidth);

        const totalNeededWidth = htmlNeededWidth + cssNeededWidth;

        if (totalNeededWidth > containerWidth) {
            const remainingWidth = containerWidth - minEditorWidth * 2;

            if (remainingWidth <= 0) {
                return { html: 50, css: 50 };
            }

            const htmlRatio = htmlNeededWidth / totalNeededWidth;
            const cssRatio = cssNeededWidth / totalNeededWidth;

            const htmlWidth = minEditorWidth + remainingWidth * htmlRatio;
            const cssWidth = minEditorWidth + remainingWidth * cssRatio;

            return {
                html: (htmlWidth / containerWidth) * 100,
                css: (cssWidth / containerWidth) * 100,
            };
        } else {
            const htmlRatio = htmlNeededWidth / totalNeededWidth;
            const cssRatio = cssNeededWidth / totalNeededWidth;

            return {
                html: htmlRatio * 100,
                css: cssRatio * 100,
            };
        }
    };

    // 幅を再計算して更新する関数
    const updateSectionWidths = () => {
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

        const htmlEditorHeight = calculateEditorHeightByCode(htmlCode);
        const cssEditorHeight = showCSSEditor ? calculateEditorHeightByCode(cssCode) : 0;

        const maxEditorHeight = Math.max(htmlEditorHeight, cssEditorHeight);
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
        setTimeout(() => {
            calculatePreviewHeight();
        }, 100);
    };

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
    }, []);

    // コード変更時の高さ調整
    useEffect(() => {
        updateEditorHeight();
        updatePreviewHeight();
    }, [htmlCode, cssCode, minHeight]);

    // HTML末尾改行保証
    useEffect(() => {
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
    }, [htmlCode]);

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
        const styleTag = showCSSEditor && cssCode ? `<style>\n${cssCode}\n</style>` : '';

        if (processedHtml.includes('<!DOCTYPE') || processedHtml.includes('<html')) {
            if (styleTag) return processedHtml.replace(/<\/head>/, `${styleTag}\n</head>`);
            return processedHtml;
        }

        return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>プレビュー</title>
  ${styleTag}
</head>
<body>
  ${processedHtml}
</body>
</html>`;
    };

    const handleHtmlChange = (value: string | undefined) => setHtmlCode(value || '');
    const handleCssChange = (value: string | undefined) => setCssCode(value || '');

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

    const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';

    return (
        <div className={styles.codePreviewContainer}>
            {title && (
                <div className={styles.header}>
                    <h4 className={styles.title}>{title}</h4>
                </div>
            )}

            <div className={styles.splitLayout} ref={containerRef}>
                {/* エディタセクション（上段） */}
                <div className={styles.editorsRow}>
                    {/* HTMLエディタ */}
                    <div className={styles.editorSection} style={{ width: `${sectionWidths.html}%` }}>
                        <div className={styles.sectionHeader}>HTML</div>
                        <div className={styles.editorContainer}>
                            <Editor
                                height={editorHeight}
                                defaultLanguage="html"
                                value={htmlCode}
                                onChange={handleHtmlChange}
                                onMount={handleHtmlEditorDidMount}
                                theme={editorTheme}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'off',
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

                    {/* CSSエディタ（CSSが定義されている場合のみ） */}
                    {showCSSEditor && (
                        <div className={styles.editorSection} style={{ width: `${sectionWidths.css}%` }}>
                            <div className={styles.sectionHeader}>CSS</div>
                            <div className={styles.editorContainer}>
                                <Editor
                                    height={editorHeight}
                                    defaultLanguage="css"
                                    value={cssCode}
                                    onChange={handleCssChange}
                                    onMount={handleCssEditorDidMount}
                                    theme={editorTheme}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'off',
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
                    )}
                </div>

                {/* プレビュー（下段） */}
                <div className={styles.previewSection}>
                    <div className={styles.sectionHeader}>プレビュー</div>
                    <div className={styles.previewContainer} style={{ '--min-height': minHeight } as React.CSSProperties}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={generatePreviewDocument()}
                            className={styles.preview}
                            title="HTML+CSS Preview"
                            sandbox="allow-scripts allow-same-origin"
                            style={{ height: previewHeight, '--min-height': minHeight } as React.CSSProperties}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
