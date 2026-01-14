import type { editor } from 'monaco-editor';

export type EditorKey = 'html' | 'css' | 'js';
export type ImageMap = Record<string, string>;
export type MinHeightValue = number | string;

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
     * Code blocks to seed editors. Use fenced blocks with language labels:
     * html, css, js, or javascript.
     */
    children?: React.ReactNode;
    /**
     * Initial visibility of the file structure panel.
     * true shows the panel, false hides it.
     * When omitted, it is shown only if file paths or images are provided.
     */
    fileStructureVisible?: boolean;
    title?: string;
    minHeight?: MinHeightValue;
    /**
     * Monaco editor theme. Defaults to 'light'.
     */
    theme?: 'light' | 'dark';
    htmlVisible?: boolean;
    cssVisible?: boolean;
    jsVisible?: boolean;
    previewVisible?: boolean;
    consoleVisible?: boolean;
    /**
     * Share code between multiple CodePreview instances on the same page.
     * The first instance with initial sources and share enabled becomes the source provider.
     */
    sourceId?: string;
    /**
     * When using sourceId, controls whether this instance writes its initial
     * sources to the shared store. Defaults to true.
     */
    share?: boolean;
    /**
     * Virtual HTML file path (e.g. "index.html").
     * Defaults to "index.html".
     */
    htmlPath?: string;
    /**
     * Virtual CSS file path (e.g. "css/style.css").
     * When provided, matching <link rel="stylesheet" href="..."> is inlined.
     */
    cssPath?: string;
    /**
     * Virtual JS file path (e.g. "js/script.js").
     * When provided, matching <script src="..."> is inlined.
     */
    jsPath?: string;
    /**
     * Image path-to-URL map (e.g. from Docusaurus static assets).
     * Example: { "img/sample.png": "/img/sample.png" }
     */
    images?: ImageMap;
}

export interface ResolvedCodePreviewProps extends Omit<CodePreviewProps, 'children'> {
    initialHTML?: string;
    initialCSS?: string;
    initialJS?: string;
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
    images?: ImageMap;
    htmlPath?: string;
    cssPath?: string;
    jsPath?: string;
}
