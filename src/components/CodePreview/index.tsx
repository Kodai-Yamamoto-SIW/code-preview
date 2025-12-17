import React from 'react';
import { CodePreviewProps } from './types';
import { useCodePreview } from './hooks/useCodePreview';
import { CodePreviewLayout } from './CodePreviewLayout';

export default function CodePreview(props: CodePreviewProps) {
    const hookResult = useCodePreview(props);
    const {
        title,
        minHeight = '200px',
        imageBasePath,
        cssPath,
        jsPath,
        editorOptions
    } = props;

    return (
        <CodePreviewLayout
            {...hookResult}
            title={title}
            minHeight={minHeight}
            imageBasePath={imageBasePath}
            cssPath={cssPath}
            jsPath={jsPath}
            editorOptions={editorOptions}
        />
    );
}
