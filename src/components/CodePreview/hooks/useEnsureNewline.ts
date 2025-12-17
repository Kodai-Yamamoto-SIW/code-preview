import { useEffect, RefObject } from 'react';
import type { editor } from 'monaco-editor';

/**
 * コードの末尾に改行がない場合、自動的に改行を追加するフック。
 * エディタのカーソル位置を保持しながら更新します。
 */
export const useEnsureNewline = (
    code: string | undefined,
    setCode: (value: string) => void,
    editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
    isVisible: boolean
) => {
    useEffect(() => {
        if (!isVisible) return;
        // codeがundefinedの場合は何もしない
        if (code && !code.endsWith('\n')) {
            // エディタがまだ準備できていない、または編集中（フォーカスがある）の場合は自動修正しない
            if (!editorRef.current || editorRef.current.hasTextFocus()) {
                return;
            }

            const newValue = code + '\n';

            if (editorRef.current) {
                const editorInstance = editorRef.current;
                const model = editorInstance.getModel();

                if (model) {
                    const lineCount = model.getLineCount();
                    const lastLineLength = model.getLineLength(lineCount);

                    // Undoスタックを保持するためにexecuteEditsを使用
                    editorInstance.executeEdits('ensureNewline', [{
                        range: {
                            startLineNumber: lineCount,
                            startColumn: lastLineLength + 1,
                            endLineNumber: lineCount,
                            endColumn: lastLineLength + 1
                        },
                        text: '\n',
                        forceMoveMarkers: true
                    }]);

                    // 編集操作をプッシュ（これがないとUndoスタックに追加されない場合がある）
                    editorInstance.pushUndoStop();
                }
            }

            // Reactの状態を更新（エディタの内容と一致させる）
            setCode(newValue);
        }
    }, [code, setCode, isVisible, editorRef]);
};
