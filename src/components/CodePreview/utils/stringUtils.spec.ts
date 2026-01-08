import { test, expect } from '@playwright/experimental-ct-react';
import { stripIndent, normalizeInitialCode } from './stringUtils';

test.describe('stringUtils', () => {
    test('stripIndent removes common indentation and trims blank lines', async () => {
        const input = '\n    <div>\n        <span>Hi</span>\n    </div>\n';
        const expected = '<div>\n    <span>Hi</span>\n</div>';
        expect(stripIndent(input)).toBe(expected);
    });

    test('normalizeInitialCode leaves single-line strings unchanged', async () => {
        const input = '  <div></div>';
        expect(normalizeInitialCode(input)).toBe(input);
    });
});
