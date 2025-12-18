import React from 'react';
import styles from '../styles.module.css';
import { Toolbar } from './Toolbar';
import { EditorPanel } from './EditorPanel';
import { Resizer } from './Resizer';
import { EditorKey, EditorConfig } from '../types';
import type { editor } from 'monaco-editor';

interface EditorSectionProps {
    layout: {
        visibleEditorConfigs: EditorConfig[];
        sectionWidths: { [key in EditorKey]: string };
        editorHeight: string;
        showLineNumbers: boolean;
        isResizing: boolean;
    };
    state: {
        editorTheme: string;
        showFileStructure: boolean;
    };
    handlers: {
        handleMouseDown: (e: React.MouseEvent, left: EditorKey, right: EditorKey) => void;
        handleResizerKeyDown: (e: React.KeyboardEvent, left: EditorKey, right: EditorKey) => void;
        resetSectionWidthsToAuto: () => void;
        toggleLineNumbers: () => void;
        toggleFileStructure: () => void;
        handleResetMouseDown: () => void;
        handleResetMouseUp: () => void;
        handleResetMouseLeave: () => void;
        resetProgress: number;
    };
    editorOptions?: editor.IEditorConstructionOptions;
    editorsRowRef: React.RefObject<HTMLDivElement>;
    editorsRowStyle?: React.CSSProperties;
}

export const EditorSection: React.FC<EditorSectionProps> = ({
    layout,
    state,
    handlers,
    editorOptions,
    editorsRowRef,
    editorsRowStyle
}) => {
    const editorsRowClassName = layout.isResizing ? `${styles.editorsRow} ${styles.isResizing}` : styles.editorsRow;

    return (
        <div className={editorsRowClassName} style={editorsRowStyle} ref={editorsRowRef}>
            <Toolbar
                resetProgress={handlers.resetProgress}
                showLineNumbers={layout.showLineNumbers}
                showFileStructure={state.showFileStructure}
                onResetMouseDown={handlers.handleResetMouseDown}
                onResetMouseUp={handlers.handleResetMouseUp}
                onResetMouseLeave={handlers.handleResetMouseLeave}
                onToggleLineNumbers={handlers.toggleLineNumbers}
                onToggleFileStructure={handlers.toggleFileStructure}
            />

            {layout.visibleEditorConfigs.map((config, index) => {
                const nextConfig = layout.visibleEditorConfigs[index + 1];

                return (
                    <React.Fragment key={config.key}>
                        <EditorPanel
                            config={config}
                            width={layout.sectionWidths[config.key as EditorKey]}
                            height={layout.editorHeight}
                            theme={state.editorTheme}
                            showLineNumbers={layout.showLineNumbers}
                            options={editorOptions}
                        />
                        {nextConfig ? (
                            <Resizer
                                leftKey={config.key as EditorKey}
                                rightKey={nextConfig.key as EditorKey}
                                leftLabel={config.label}
                                rightLabel={nextConfig.label}
                                onMouseDown={handlers.handleMouseDown}
                                onKeyDown={handlers.handleResizerKeyDown}
                                onDoubleClick={(event) => {
                                    event.preventDefault();
                                    handlers.resetSectionWidthsToAuto();
                                }}
                            />
                        ) : null}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
