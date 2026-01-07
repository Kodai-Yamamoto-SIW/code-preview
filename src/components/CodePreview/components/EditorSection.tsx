import { Fragment } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, RefObject } from 'react';
import styles from '../styles.module.css';
import { Toolbar } from './Toolbar';
import { EditorPanel } from './EditorPanel';
import { Resizer } from './Resizer';
import { EditorKey, EditorConfig } from '../types';

interface EditorSectionProps {
    layout: {
        visibleEditorConfigs: EditorConfig[];
        sectionWidths: Record<EditorKey, number>;
        editorHeight: string;
        showLineNumbers: boolean;
        isResizing: boolean;
    };
    state: {
        editorTheme: string;
        showFileStructure: boolean;
    };
    handlers: {
        handleMouseDown: (e: ReactMouseEvent, left: EditorKey, right: EditorKey) => void;
        handleResizerKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>, left: EditorKey, right: EditorKey) => void;
        resetSectionWidthsToAuto: () => void;
        toggleLineNumbers: () => void;
        toggleFileStructure: () => void;
        handleResetMouseDown: () => void;
        handleResetMouseUp: () => void;
        handleResetMouseLeave: () => void;
        resetProgress: number;
    };
    editorsRowRef: RefObject<HTMLDivElement | null>;
    editorsRowStyle?: CSSProperties;
}

export const EditorSection = ({
    layout,
    state,
    handlers,
    editorsRowRef,
    editorsRowStyle
}: EditorSectionProps) => {
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
                    <Fragment key={config.key}>
                        <EditorPanel
                            config={config}
                            width={layout.sectionWidths[config.key as EditorKey]}
                            height={layout.editorHeight}
                            theme={state.editorTheme}
                            showLineNumbers={layout.showLineNumbers}
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
                    </Fragment>
                );
            })}
        </div>
    );
};
