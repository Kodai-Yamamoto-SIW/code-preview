/**
 * 文字列の末尾に改行がない場合、改行を追加して返します。
 * @param code 対象の文字列
 * @returns 末尾に改行コードが付与された文字列
 */
export const ensureTrailingNewline = (code: string): string => {
    if (code && !code.endsWith('\n')) {
        return code + '\n';
    }
    return code;
};
