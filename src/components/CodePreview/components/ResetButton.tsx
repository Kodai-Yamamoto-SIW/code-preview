import styles from '../styles.module.css';

interface ResetButtonProps {
    resetProgress: number;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

export const ResetButton = ({
    resetProgress,
    onMouseDown,
    onMouseUp,
    onMouseLeave
}: ResetButtonProps) => {
    return (
        <button
            type="button"
            className={styles.gyoButton}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onMouseDown}
            onTouchEnd={onMouseUp}
            title="長押しでリセット"
        >
            <span
                className={
                    styles.resetProgressCircle +
                    (resetProgress > 0 ? ' ' + styles.isCharging : '')
                }
                aria-hidden="true"
            >
                <svg width="24" height="24" viewBox="0 0 24 24">
                    {/* チャージ進行度（細め・進行時のみ） */}
                    {resetProgress > 0 && (
                        <circle
                            cx="12" cy="12" r="10"
                            fill="none"
                            stroke="#218bff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 10}
                            strokeDashoffset={(1 - resetProgress) * 2 * Math.PI * 10}
                            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                        />
                    )}
                    {/* 中央のリロード（リセット）アイコン */}
                    <g>
                        <path
                            d="M12 5a7 7 0 1 1-5.3 2.7"
                            fill="none"
                            stroke="#218bff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <polyline
                            points="6.5,7.5 6.5,4.5 9.5,4.5"
                            fill="none"
                            stroke="#218bff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </g>
                </svg>
            </span>
            <span className={styles.hiddenText}>長押しでリセット</span>
        </button>
    );
};
