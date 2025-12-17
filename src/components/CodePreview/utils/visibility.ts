/**
 * CodePreviewに関連する表示ロジックのユーティリティ
 */

/**
 * プロパティによる表示指定と自動判定を解決して最終的な表示状態を決定する
 * 
 * @param autoVisible - 自動判定による表示状態 (例: コードが存在するかどうか)
 * @param override - プロパティによる強制表示指定 (booleanの場合)
 * @returns 最終的な表示状態
 */
export const resolveVisibility = (autoVisible: boolean, override?: boolean): boolean => {
    if (typeof override === 'boolean') {
        return override;
    }
    return autoVisible;
};
