import { test, expect } from '@playwright/experimental-ct-react';
import { processImagePaths, resolveFilePaths } from './htmlProcessor';

test.describe('htmlProcessor', () => {
    test.describe('processImagePaths', () => {
        test('should replace src attributes', async () => {
            const html = '<img src="test.png">';
            const result = processImagePaths(html, '/base/');
            expect(result).toBe('<img src="/base/test.png">');
        });

        test('should handle spaces around =', async () => {
            const html = '<img src = "test.png">';
            const result = processImagePaths(html, '/base/');
            expect(result).toBe('<img src = "/base/test.png">');
        });

        test('should handle single quotes', async () => {
            const html = "<img src='test.png'>";
            const result = processImagePaths(html, '/base/');
            expect(result).toBe("<img src='/base/test.png'>");
        });

        test('should handle srcset', async () => {
            const html = '<img srcset="test.png 1x, test2.png 2x">';
            const result = processImagePaths(html, '/base/');
            expect(result).toBe('<img srcset="/base/test.png 1x, /base/test2.png 2x">');
        });

        test('should not replace if no base path or resolved images', async () => {
            const html = '<img src="test.png">';
            const result = processImagePaths(html);
            expect(result).toBe(html);
        });

        test('should not replace data-src', async () => {
            const html = '<img data-src="test.png">';
            const result = processImagePaths(html, '/base/');
            expect(result).toBe('<img data-src="test.png">');
        });

        test('should not replace attributes that just end with src like mysrc', async () => {
            const html = '<div mysrc="test.png"></div>';
            const result = processImagePaths(html, '/base/');
            expect(result).toBe('<div mysrc="test.png"></div>');
        });
    });

    test.describe('resolveFilePaths', () => {
        test('should replace css link', async () => {
            const html = '<link rel="stylesheet" href="style.css">';
            const cssCode = 'body { color: red; }';
            const result = resolveFilePaths(html, 'style.css', cssCode);
            expect(result.processed).toContain('<style data-from-file="style.css">\nbody { color: red; }\n</style>');
        });

        test('should replace css link with attributes in different order', async () => {
            const html = '<link href="style.css" rel="stylesheet">';
            const cssCode = 'body { color: red; }';
            const result = resolveFilePaths(html, 'style.css', cssCode);
            expect(result.processed).toContain('<style data-from-file="style.css">\nbody { color: red; }\n</style>');
        });

        test('should replace css link with spaces', async () => {
            const html = '<link rel = "stylesheet" href = "style.css">';
            const cssCode = 'body { color: red; }';
            const result = resolveFilePaths(html, 'style.css', cssCode);
            expect(result.processed).toContain('<style data-from-file="style.css">\nbody { color: red; }\n</style>');
        });

        test('should replace script tag', async () => {
            const html = '<script src="script.js"></script>';
            const jsCode = 'console.log("hello");';
            const result = resolveFilePaths(html, undefined, undefined, 'script.js', jsCode);
            expect(result.processed).toContain('<script data-from-file="script.js">\nconsole.log("hello");\n</script>');
            expect(result.jsInjected).toBe(true);
        });

        test('should replace script tag with attributes', async () => {
            const html = '<script type="module" src="script.js"></script>';
            const jsCode = 'console.log("hello");';
            const result = resolveFilePaths(html, undefined, undefined, 'script.js', jsCode);
            expect(result.processed).toContain('<script data-from-file="script.js">\nconsole.log("hello");\n</script>');
            expect(result.jsInjected).toBe(true);
        });
    });
});
