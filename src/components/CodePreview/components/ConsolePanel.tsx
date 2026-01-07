import styles from '../styles.module.css';

interface ConsolePanelProps {
    logs: string[];
}

export const ConsolePanel = ({ logs }: ConsolePanelProps) => {
    return (
        <div className={styles.consoleSection}>
            <div className={styles.sectionHeader}>コンソール</div>
            <div className={styles.consoleContainer}>
                {logs.length === 0 ? (
                    <div className={styles.consolePlaceholder}>ここに console.log の結果が表示されます</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className={styles.consoleLine}>
                            <span className={styles.consoleBullet}>▶</span>
                            <span>{log}</span>
                        </div>
                    ))
                )
                }
            </div>
        </div>
    );
};
