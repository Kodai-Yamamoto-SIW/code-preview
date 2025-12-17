import { useState, useEffect } from 'react';
import type { editor } from 'monaco-editor';

interface UseEditorHeightProps {
    minHeight: string;
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    showHTMLEditor: boolean;
    showCSSEditor: boolean;
    showJSEditor: boolean;
    htmlEditorRef?: React.RefObject<editor.IStandaloneCodeEditor | null>;
    cssEditorRef?: React.RefObject<editor.IStandaloneCodeEditor | null>;
    jsEditorRef?: React.RefObject<editor.IStandaloneCodeEditor | null>;
}

export const useEditorHeight = ({
    minHeight,
    htmlCode,
    cssCode,
    jsCode,
    showHTMLEditor,
    showCSSEditor,
    showJSEditor,
    htmlEditorRef,
    cssEditorRef,
    jsEditorRef
}: UseEditorHeightProps) => {
    const [editorHeight, setEditorHeight] = useState(minHeight);

    const calculateEditorHeight = () => {
        const calculateEditorHeightByCode = (code: string, editorRef?: React.RefObject<editor.IStandaloneCodeEditor | null>): number => {
            // Try to use actual editor content height if available
            if (editorRef && editorRef.current) {
                const editorInstance = editorRef.current;
                // getContentHeight returns the height of the content
                const contentHeight = editorInstance.getContentHeight();
                if (contentHeight > 0) {
                    return contentHeight;
                }
            }

            // Fallback to heuristic
            if (!code) return parseInt(minHeight);
            const lines = code.split('\n').length;
            const lineHeight = 19; // Monaco editor line height
            const padding = 22; // Vertical padding
            return Math.max(lines * lineHeight + padding, parseInt(minHeight));
        };

        const htmlEditorHeight = showHTMLEditor ? calculateEditorHeightByCode(htmlCode, htmlEditorRef) : 0;
        const cssEditorHeight = showCSSEditor ? calculateEditorHeightByCode(cssCode, cssEditorRef) : 0;
        const jsEditorHeight = showJSEditor ? calculateEditorHeightByCode(jsCode, jsEditorRef) : 0;

        const maxEditorHeight = Math.max(htmlEditorHeight, cssEditorHeight, jsEditorHeight);
        const finalEditorHeight = Math.max(maxEditorHeight, parseInt(minHeight));
        const limitedEditorHeight = Math.min(finalEditorHeight, 600);

        setEditorHeight(limitedEditorHeight + 'px');
    };

    const updateEditorHeight = () => {
        setTimeout(() => {
            calculateEditorHeight();
        }, 100);
    };

    useEffect(() => {
        updateEditorHeight();
    }, [htmlCode, cssCode, jsCode, minHeight, showHTMLEditor, showCSSEditor, showJSEditor]);

    useEffect(() => {
        const handleResize = () => {
            updateEditorHeight();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { editorHeight, updateEditorHeight };
};
