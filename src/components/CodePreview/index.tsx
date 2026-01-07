import { CodePreviewProps } from './types';
import { useCodePreview } from './hooks/useCodePreview';
import { CodePreviewLayout } from './CodePreviewLayout';

export default function CodePreview(props: CodePreviewProps) {
    const hookResult = useCodePreview(props);
    const {
        title,
        cssPath,
        jsPath
    } = props;

    return (
        <CodePreviewLayout
            {...hookResult}
            title={title}
            cssPath={cssPath}
            jsPath={jsPath}
        />
    );
}
