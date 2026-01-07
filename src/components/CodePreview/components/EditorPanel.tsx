import { useMemo } from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import styles from '../styles.module.css';

import { EditorConfig } from '../types';

interface EditorPanelProps {
    config: EditorConfig;
    width: number;
    height: string;
    theme: string;
    showLineNumbers: boolean;
}

const DEFAULT_EDITOR_OPTIONS: EditorProps['options'] = {
    minimap: { enabled: false },
    fontSize: 14,
    folding: false,
    padding: { top: 5, bottom: 5 },
    roundedSelection: false,
    wordWrap: 'off',
    tabSize: 2,
    insertSpaces: true,
    scrollBeyondLastLine: false,
};

export const EditorPanel = ({
    config,
    width,
    height,
    theme,
    showLineNumbers
}: EditorPanelProps) => {
    const mergedOptions = useMemo(() => ({
        ...DEFAULT_EDITOR_OPTIONS,
        lineNumbers: showLineNumbers ? 'on' : 'off',
    } as EditorProps['options']), [showLineNumbers]);

    return (
        <div className={styles.editorSection} style={{ width: `${width}%` }}>
            <div className={styles.sectionHeader}>{config.label}</div>
            <div className={styles.editorContainer}>
                <Editor
                    height={height}
                    defaultLanguage={config.language}
                    value={config.value}
                    onChange={config.onChange}
                    onMount={config.onMount}
                    theme={theme}
                    options={mergedOptions}
                />
            </div>
        </div>
    );
};
