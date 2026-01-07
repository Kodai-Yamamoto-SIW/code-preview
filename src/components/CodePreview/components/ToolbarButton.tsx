import type { ReactNode } from 'react';
import styles from '../styles.module.css';

interface ToolbarButtonProps {
    onClick: () => void;
    pressed: boolean;
    label: string;
    icon: ReactNode;
}

export const ToolbarButton = ({
    onClick,
    pressed,
    label,
    icon
}: ToolbarButtonProps) => {
    return (
        <button
            type="button"
            className={styles.gyoButton}
            onClick={onClick}
            aria-pressed={pressed}
            title={label}
        >
            <span aria-hidden="true">{icon}</span>
            <span className={styles.hiddenText}>{label}</span>
        </button>
    );
};
