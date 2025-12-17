export const resolvePath = (baseFile: string, relativePath: string): string => {
    const stack = baseFile.split('/');
    stack.pop(); // ファイル名を除去してディレクトリにする

    const parts = relativePath.split('/');
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            if (stack.length > 0) stack.pop();
        } else {
            stack.push(part);
        }
    }
    return stack.join('/');
};
