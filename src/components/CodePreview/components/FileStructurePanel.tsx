import { useMemo } from 'react';
import styles from '../styles.module.css';
import { buildFileStructure } from '../utils/fileStructureUtils';
import type { ImageMap } from '../types';

interface FileStructurePanelProps {
    resolvedHtmlPath?: string;
    resolvedCssPath?: string;
    resolvedJsPath?: string;
    resolvedImages?: ImageMap;
}

export const FileStructurePanel = ({
    resolvedHtmlPath,
    resolvedCssPath,
    resolvedJsPath,
    resolvedImages
}: FileStructurePanelProps) => {
    const { folders, rootFiles } = useMemo(() => 
        buildFileStructure(resolvedHtmlPath, resolvedCssPath, resolvedJsPath, resolvedImages),
        [resolvedHtmlPath, resolvedCssPath, resolvedJsPath, resolvedImages]
    );

    return (
        <div className={styles.fileStructure}>
            <div className={styles.fileStructureTitle}>📁 ファイル構造</div>
            <div className={styles.fileTree}>
                {rootFiles.map(file => (
                    <div key={file} className={styles.fileTreeItem}>
                        <span className={styles.fileIcon}>📄</span> {file}
                    </div>
                ))}
                {Array.from(folders.entries()).map(([folderPath, files]) => (
                    <div key={folderPath} className={styles.fileTreeFolder}>
                        <div className={styles.fileTreeItem}>
                            <span className={styles.folderIcon}>📁</span> {folderPath}
                        </div>
                        {files.map(file => (
                            <div key={`${folderPath}/${file}`} className={styles.fileTreeSubItem}>
                                <span className={styles.fileIcon}>📄</span> {file}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
