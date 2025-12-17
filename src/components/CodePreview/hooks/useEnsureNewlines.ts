import { useEnsureNewline } from './useEnsureNewline';
import type { editor } from 'monaco-editor';

interface UseEnsureNewlinesProps {
    htmlCode: string;
    setHtmlCode: (value: string) => void;
    htmlEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    showHTMLEditor: boolean;
    cssCode: string;
    setCssCode: (value: string) => void;
    cssEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    showCSSEditor: boolean;
    jsCode: string;
    setJsCode: (value: string) => void;
    jsEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    showJSEditor: boolean;
}

export const useEnsureNewlines = ({
    htmlCode, setHtmlCode, htmlEditorRef, showHTMLEditor,
    cssCode, setCssCode, cssEditorRef, showCSSEditor,
    jsCode, setJsCode, jsEditorRef, showJSEditor
}: UseEnsureNewlinesProps) => {
    useEnsureNewline(htmlCode, setHtmlCode, htmlEditorRef, showHTMLEditor);
    useEnsureNewline(cssCode, setCssCode, cssEditorRef, showCSSEditor);
    useEnsureNewline(jsCode, setJsCode, jsEditorRef, showJSEditor);
};
