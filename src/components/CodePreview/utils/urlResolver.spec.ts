import { test, expect } from '@playwright/experimental-ct-react';
import { resolveUrl } from './urlResolver';

test.describe('urlResolver', () => {
    test('should return path as is if it is absolute or data uri', () => {
        expect(resolveUrl('/test.png', '/base/')).toBe('/test.png');
        expect(resolveUrl('http://example.com/test.png', '/base/')).toBe('http://example.com/test.png');
        expect(resolveUrl('https://example.com/test.png', '/base/')).toBe('https://example.com/test.png');
        expect(resolveUrl('data:image/png;base64,...', '/base/')).toBe('data:image/png;base64,...');
    });

    test('should resolve relative path with base', () => {
        expect(resolveUrl('test.png', '/base/')).toBe('/base/test.png');
    });

    test('should resolve using resolvedImages map', () => {
        const resolvedImages = {
            'test.png': 'blob:url1',
            'img/test.png': 'blob:url2'
        };
        expect(resolveUrl('test.png', '/base/', resolvedImages)).toBe('blob:url1');
        expect(resolveUrl('./test.png', '/base/', resolvedImages)).toBe('blob:url1');
        expect(resolveUrl('img/test.png', '/base/', resolvedImages)).toBe('blob:url2');
        expect(resolveUrl('../img/test.png', '/base/', resolvedImages)).toBe('blob:url2');
    });

    test('should fallback to base if not in resolvedImages', () => {
        const resolvedImages = {
            'other.png': 'blob:url1'
        };
        expect(resolveUrl('test.png', '/base/', resolvedImages)).toBe('/base/test.png');
    });
});
