import React from 'react';
import styles from '../styles.module.css';

interface ToolbarProps {
    resetProgress: number;
    showLineNumbers: boolean;
    showFileStructure: boolean;
    onResetMouseDown: () => void;
    onResetMouseUp: () => void;
    onResetMouseLeave: () => void;
    onToggleLineNumbers: () => void;
    onToggleFileStructure: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    resetProgress,
    showLineNumbers,
    showFileStructure,
    onResetMouseDown,
    onResetMouseUp,
    onResetMouseLeave,
    onToggleLineNumbers,
    onToggleFileStructure
}) => {
    return (
        <>
            <button
                type="button"
                className={styles.gyoButton}
                onMouseDown={onResetMouseDown}
                onMouseUp={onResetMouseUp}
                onMouseLeave={onResetMouseLeave}
                onTouchStart={onResetMouseDown}
                onTouchEnd={onResetMouseUp}
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
            <button
                type="button"
                className={styles.gyoButton}
                onClick={onToggleLineNumbers}
                aria-pressed={showLineNumbers}
                title={showLineNumbers ? '行番号を隠す' : '行番号を表示'}
            >
                <span aria-hidden="true">#</span>
                <span className={styles.hiddenText}>{showLineNumbers ? '行番号を隠す' : '行番号を表示'}</span>
            </button>
            <button
                type="button"
                className={styles.gyoButton}
                onClick={onToggleFileStructure}
                aria-pressed={showFileStructure}
                title={showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}
            >
                <span aria-hidden="true">📁</span>
                <span className={styles.hiddenText}>{showFileStructure ? 'ファイル構造を隠す' : 'ファイル構造を表示'}</span>
            </button>
        </>
    );
};
