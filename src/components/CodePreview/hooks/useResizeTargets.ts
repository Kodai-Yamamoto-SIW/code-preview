import { useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { EditorKey } from '../types';

interface UseResizeTargetsProps {
    showHTMLEditor: boolean;
    showCSSEditor: boolean;
    showJSEditor: boolean;
    htmlEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    cssEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
    jsEditorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
}

export const useResizeTargets = ({
    showHTMLEditor,
    showCSSEditor,
    showJSEditor,
    htmlEditorRef,
    cssEditorRef,
    jsEditorRef
}: UseResizeTargetsProps) => {
    return useMemo(() => [
        showHTMLEditor ? { key: 'html' as EditorKey, ref: htmlEditorRef } : null,
        showCSSEditor ? { key: 'css' as EditorKey, ref: cssEditorRef } : null,
        showJSEditor ? { key: 'js' as EditorKey, ref: jsEditorRef } : null,
    ].filter((t): t is { key: EditorKey, ref: React.RefObject<editor.IStandaloneCodeEditor | null> } => t !== null), 
    [showHTMLEditor, showCSSEditor, showJSEditor, htmlEditorRef, cssEditorRef, jsEditorRef]);
};
