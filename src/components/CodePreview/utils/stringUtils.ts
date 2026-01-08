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

export const stripIndent = (value: string): string => {
    const normalized = value.replace(/\r\n?/g, '\n');
    const lines = normalized.split('\n');

    let start = 0;
    let end = lines.length;

    while (start < end && lines[start].trim() === '') {
        start += 1;
    }
    while (end > start && lines[end - 1].trim() === '') {
        end -= 1;
    }

    const trimmed = lines.slice(start, end);
    if (trimmed.length === 0) {
        return '';
    }

    const indents = trimmed
        .filter(line => line.trim().length > 0)
        .map(line => line.match(/^\s*/)?.[0].length ?? 0);
    const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

    return trimmed.map(line => line.slice(minIndent)).join('\n');
};

export const normalizeInitialCode = (code?: string): string | undefined => {
    if (code === undefined) {
        return undefined;
    }
    if (!code.includes('\n') && !code.includes('\r')) {
        return code;
    }
    return stripIndent(code);
};
