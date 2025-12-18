import React from 'react';
import styles from '../styles.module.css';
import { EditorKey } from '../types';

interface ResizerProps {
    leftKey: EditorKey;
    rightKey: EditorKey;
    leftLabel: string;
    rightLabel: string;
    onMouseDown: (event: React.MouseEvent, left: EditorKey, right: EditorKey) => void;
    onKeyDown: (event: React.KeyboardEvent, left: EditorKey, right: EditorKey) => void;
    onDoubleClick: (event: React.MouseEvent) => void;
}

export const Resizer: React.FC<ResizerProps> = ({
    leftKey,
    rightKey,
    leftLabel,
    rightLabel,
    onMouseDown,
    onKeyDown,
    onDoubleClick
}) => {
    return (
        <div
            className={styles.resizer}
            role="separator"
            aria-orientation="vertical"
            aria-label={`${leftLabel} と ${rightLabel} の幅を調整`}
            tabIndex={0}
            onMouseDown={event => onMouseDown(event, leftKey, rightKey)}
            onKeyDown={event => onKeyDown(event, leftKey, rightKey)}
            onDoubleClick={onDoubleClick}
        >
            <span className={styles.resizerGrip} />
        </div>
    );
};
