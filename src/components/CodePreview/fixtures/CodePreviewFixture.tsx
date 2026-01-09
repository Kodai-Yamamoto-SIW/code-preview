import type { CodePreviewProps } from '../types';
import CodePreview from '../index';

type CodePreviewFixtureProps = Omit<CodePreviewProps, 'children'> & {
    html?: string;
    css?: string;
    js?: string;
    jsLanguage?: 'js' | 'javascript';
};

const buildFence = (language: string, code: string) => `\`\`\`${language}\n${code}\n\`\`\``;

export const CodePreviewFixture = ({
    html,
    css,
    js,
    jsLanguage = 'js',
    ...props
}: CodePreviewFixtureProps) => {
    const blocks: string[] = [];

    if (html !== undefined) {
        blocks.push(buildFence('html', html));
    }
    if (css !== undefined) {
        blocks.push(buildFence('css', css));
    }
    if (js !== undefined) {
        blocks.push(buildFence(jsLanguage, js));
    }

    const children = blocks.length > 0 ? blocks.join('\n\n') : undefined;

    return (
        <CodePreview {...props}>
            {children}
        </CodePreview>
    );
};
