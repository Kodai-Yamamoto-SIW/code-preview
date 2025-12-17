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
            const newValue = code + '\n';
            setCode(newValue);

            if (editorRef.current) {
                const editorInstance = editorRef.current;
                const position = editorInstance.getPosition();

                // Note: setValueはUndoスタックをリセットする可能性がありますが、
                // 既存の挙動を維持するために使用しています。
                // 必要であれば executeEdits に変更することを検討してください。
                editorInstance.setValue(newValue);
                if (position) editorInstance.setPosition(position);
            }
        }
    }, [code, setCode, isVisible, editorRef]);
};
