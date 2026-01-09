import { useMemo } from 'react';
import { CodePreviewProps } from './types';
import { useCodePreview } from './hooks/useCodePreview';
import { CodePreviewLayout } from './CodePreviewLayout';
import { parseCodeBlocksFromChildren } from './utils/codeBlockParser';

export default function CodePreview(props: CodePreviewProps) {
    const {
        children,
        title,
        cssPath,
        jsPath,
        ...rest
    } = props;
    const { initialHTML: _initialHTML, initialCSS: _initialCSS, initialJS: _initialJS, ...restWithoutInitial } = rest as {
        initialHTML?: string;
        initialCSS?: string;
        initialJS?: string;
    };
    const resolvedSource = useMemo(() => parseCodeBlocksFromChildren(children), [children]);
    const hookResult = useCodePreview({ ...restWithoutInitial, cssPath, jsPath, ...resolvedSource });

    return (
        <CodePreviewLayout
            {...hookResult}
            title={title}
            cssPath={cssPath}
            jsPath={jsPath}
        />
    );
}
