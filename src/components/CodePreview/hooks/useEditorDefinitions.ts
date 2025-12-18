import { useMemo, MutableRefObject } from 'react';
import type { editor } from 'monaco-editor';
import { EditorDefinition } from '../types';

interface UseEditorDefinitionsProps {
    htmlCode: string;
    setHtmlCode: (code: string) => void;
    cssCode: string;
    setCssCode: (code: string) => void;
    jsCode: string;
    setJsCode: (code: string) => void;
    showHTMLEditor: boolean;
    showCSSEditor: boolean;
    showJSEditor: boolean;
    htmlEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
    cssEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
    jsEditorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>;
}

export const useEditorDefinitions = ({
    htmlCode, setHtmlCode,
    cssCode, setCssCode,
    jsCode, setJsCode,
    showHTMLEditor,
    showCSSEditor,
    showJSEditor,
    htmlEditorRef,
    cssEditorRef,
    jsEditorRef
}: UseEditorDefinitionsProps): EditorDefinition[] => {
    return useMemo(() => [
        {
            key: 'html',
            label: 'HTML',
            language: 'html',
            code: htmlCode,
            setCode: setHtmlCode,
            visible: showHTMLEditor,
            ref: htmlEditorRef
        },
        {
            key: 'css',
            label: 'CSS',
            language: 'css',
            code: cssCode,
            setCode: setCssCode,
            visible: showCSSEditor,
            ref: cssEditorRef
        },
        {
            key: 'js',
            label: 'JavaScript',
            language: 'javascript',
            code: jsCode,
            setCode: setJsCode,
            visible: showJSEditor,
            ref: jsEditorRef
        }
    ], [htmlCode, cssCode, jsCode, setHtmlCode, setCssCode, setJsCode, showHTMLEditor, showCSSEditor, showJSEditor, htmlEditorRef, cssEditorRef, jsEditorRef]);
};
