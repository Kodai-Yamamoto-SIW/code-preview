import React from 'react';
import Editor from '@monaco-editor/react';
import styles from '../styles.module.css';

import { EditorConfig } from '../types';

interface EditorPanelProps {
    config: EditorConfig;
    width: number;
    height: string;
    theme: string;
    showLineNumbers: boolean;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
    config,
    width,
    height,
    theme,
    showLineNumbers
}) => {
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
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: showLineNumbers ? 'on' : 'off',
                        folding: false,
                        padding: { top: 5, bottom: 5 },
                        roundedSelection: false,
                        wordWrap: 'off',
                        tabSize: 2,
                        insertSpaces: true,
                        scrollBeyondLastLine: false,
                    }}
                />
            </div>
        </div>
    );
};
