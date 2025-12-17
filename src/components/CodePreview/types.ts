import type { editor } from 'monaco-editor';

export type EditorKey = 'html' | 'css' | 'js';

export interface EditorDefinition {
    key: EditorKey;
    label: string;
    language: string;
    code: string;
    setCode: (value: string) => void;
    visible: boolean;
    ref: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
}

export interface CodePreviewProps {
    /**
     * ファイル構造（エクスプローラ）の初期表示状態
     * trueで初期表示、falseで非表示
     * 省略時は、imagesが指定されている場合はtrue、それ以外はfalseになります
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
     * ※この共有は同一ページ内でのみ有効です。
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
    /**
     * Monaco Editorのオプション
     */
    editorOptions?: editor.IEditorConstructionOptions;
}

export interface EditorConfig {
    key: string;
    label: string;
    language: string;
    value: string;
    onChange: (value: string | undefined) => void;
    onMount: (editorInstance: editor.IStandaloneCodeEditor) => void;
    visible: boolean;
}

export interface SourceCodeState {
    html: string;
    css: string;
    js: string;
    images?: { [path: string]: string };
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}
