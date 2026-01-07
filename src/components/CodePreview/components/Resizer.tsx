import type { KeyboardEvent, MouseEvent } from 'react';
import styles from '../styles.module.css';
import { EditorKey } from '../types';

interface ResizerProps {
    leftKey: EditorKey;
    rightKey: EditorKey;
    leftLabel: string;
    rightLabel: string;
    onMouseDown: (event: MouseEvent, left: EditorKey, right: EditorKey) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>, left: EditorKey, right: EditorKey) => void;
    onDoubleClick: (event: MouseEvent) => void;
}

export const Resizer = ({
    leftKey,
    rightKey,
    leftLabel,
    rightLabel,
    onMouseDown,
    onKeyDown,
    onDoubleClick
}: ResizerProps) => {
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
