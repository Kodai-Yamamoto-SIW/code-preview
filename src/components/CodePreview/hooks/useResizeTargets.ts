import { useMemo } from 'react';
import type { editor } from 'monaco-editor';
import { EditorDefinition, EditorKey } from '../types';
import { ResizeTarget } from './useEditorResize';

interface UseResizeTargetsProps {
    editors: EditorDefinition[];
}

export const useResizeTargets = ({
    editors
}: UseResizeTargetsProps): ResizeTarget<EditorKey>[] => {
    return useMemo(() => {
        return editors
            .filter(editor => editor.visible)
            .map(editor => ({
                key: editor.key,
                ref: editor.ref
            }));
    }, [editors]);
};
