import { useEnsureNewline } from './useEnsureNewline';
import { EditorDefinition } from '../types';

interface UseEnsureNewlinesProps {
    editors: EditorDefinition[];
}

export const useEnsureNewlines = ({
    editors
}: UseEnsureNewlinesProps) => {
    // Hooks must be called unconditionally.
    // We assume the editors array structure (html, css, js) is stable or we iterate.
    // However, useEnsureNewline is a hook calling useEffect.
    // We cannot call hooks inside a loop if the loop length changes.
    // But here we are refactoring to use the array.
    
    // Since the number of editors is fixed (3) in the current implementation,
    // we can just map them. But React warns against hooks in loops.
    // So we should probably keep the explicit calls or ensure the array is always fixed length.
    // In useCodePreview, we will create an array of 3 editors.
    
    // Actually, useEnsureNewline is a custom hook.
    // If we use it inside a loop, we violate Rules of Hooks.
    // So we should probably NOT refactor this to a loop unless we extract the logic to a single useEffect that iterates.
    
    // Let's refactor useEnsureNewline to NOT be a hook, but a function called by a single useEffect in useEnsureNewlines?
    // Or just keep it as is but use the editors array to access props.
    
    const htmlEditor = editors.find(e => e.key === 'html');
    const cssEditor = editors.find(e => e.key === 'css');
    const jsEditor = editors.find(e => e.key === 'js');

    if (htmlEditor) useEnsureNewline(htmlEditor.code, htmlEditor.setCode, htmlEditor.ref, htmlEditor.visible);
    if (cssEditor) useEnsureNewline(cssEditor.code, cssEditor.setCode, cssEditor.ref, cssEditor.visible);
    if (jsEditor) useEnsureNewline(jsEditor.code, jsEditor.setCode, jsEditor.ref, jsEditor.visible);
};
