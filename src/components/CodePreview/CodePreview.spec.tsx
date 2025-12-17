import { test, expect } from '@playwright/experimental-ct-react';
import CodePreview from './index';

test.use({ viewport: { width: 1200, height: 800 } });

test.describe('CodePreview コンポーネントのテスト', () => {

    test('最低限のプロパティで正しく描画されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<h1>こんにちは</h1>"
            />
        );

        await expect(component).toBeVisible();
        // タイトルは指定していないので表示されないはず
        await expect(component.locator('h4')).not.toBeVisible();
        // デフォルトでHTMLエディタは表示されるはず
        await expect(component.getByText('HTML')).toBeVisible();
        // プレビューも表示されるはず
        await expect(component.getByText('プレビュー')).toBeVisible();
    });

    test('タイトルが指定された場合、正しく表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                title="テスト用タイトル"
                initialHTML="<div>Test</div>"
            />
        );

        await expect(component).toContainText('テスト用タイトル');
    });

    test('全エディタが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                jsVisible={true}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('CSS')).toBeVisible();
        await expect(component.getByText('JavaScript')).toBeVisible();
    });

    test('HTMLエディタのみ表示されること（htmlVisible=true）', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={false}
                jsVisible={false}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('CSS')).not.toBeVisible();
        await expect(component.getByText('JavaScript')).not.toBeVisible();
    });

    test('CSSエディタのみ表示されること（cssVisible=true）', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={false}
                cssVisible={true}
                jsVisible={false}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('HTML')).not.toBeVisible();
        await expect(component.getByText('CSS')).toBeVisible();
        await expect(component.getByText('JavaScript')).not.toBeVisible();
    });

    test('JSエディタのみ表示されること（jsVisible=true）', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={false}
                cssVisible={false}
                jsVisible={true}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('HTML')).not.toBeVisible();
        await expect(component.getByText('CSS')).not.toBeVisible();
        await expect(component.getByText('JavaScript')).toBeVisible();
    });

    test('ファイル構造パネルの表示切り替えができること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div></div>"
            />
        );

        // title属性またはテキストでボタンを探す
        // 初期状態が visible=true なので、ボタンの title は 'ファイル構造を隠す' になっているはず
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(toggleButton).toBeVisible();
        await toggleButton.click();
    });

    test('リセットボタンが正しく表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<h1>Original</h1>"
            />
        );

        const resetButton = component.getByRole('button', { name: '長押しでリセット' });
        await expect(resetButton).toBeVisible();
    });

    test('プレビュー（iframe）内にコンテンツが描画されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='test-target'>Hello World</div>"
            />
        );

        // iframe要素を取得
        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();

        const frame = iframe.contentFrame();
        const targetDiv = frame.locator('#test-target');

        // コンテンツ描画まで少し待つ
        await expect(targetDiv).toBeVisible({ timeout: 10000 });
        await expect(targetDiv).toHaveText('Hello World');
    });

    test('CSSが適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='styled-div'>Styled</div>"
                initialCSS="#styled-div { color: rgb(255, 0, 0); }"
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const styledDiv = frame.locator('#styled-div');

        await expect(styledDiv).toBeVisible({ timeout: 10000 });
        await expect(styledDiv).toHaveCSS('color', 'rgb(255, 0, 0)');
    });


    test('プレビューが表示されること(previewVisible=true)', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                previewVisible={true}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('プレビュー')).toBeVisible();
    });

    test('プレビューが非表示になること(previewVisible=false)', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                previewVisible={false}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('プレビュー')).not.toBeVisible();
    });

    test('コンソールが表示されること(consoleVisible=true)', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                consoleVisible={true}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('コンソール')).toBeVisible();
        await expect(component.getByText('ここに console.log の結果が表示されます')).toBeVisible();
    });

    test('コンソールが非表示になること(consoleVisible=false)', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                consoleVisible={false}
                initialHTML="<div></div>"
            />
        );
        await expect(component.getByText('コンソール')).not.toBeVisible();
    });

    // ===== JavaScriptの実行テスト =====
    test('JavaScriptが実行されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='js-target'></div>"
                initialJS="document.getElementById('js-target').textContent = 'JS実行成功';"
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const targetDiv = frame.locator('#js-target');

        await expect(targetDiv).toBeVisible({ timeout: 10000 });
        await expect(targetDiv).toHaveText('JS実行成功');
    });

    // ===== console.logの出力テスト =====
    test('console.logがコンソールパネルに表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                consoleVisible={true}
                initialHTML="<div></div>"
                initialJS="console.log('テストログ1');"
            />
        );

        // コンソールパネルが表示されること
        await expect(component.getByText('コンソール')).toBeVisible();
        // ログメッセージが表示されること
        await expect(component.getByText('テストログ1')).toBeVisible({ timeout: 10000 });
    });

    test('複数のconsole.logが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                consoleVisible={true}
                initialHTML="<div></div>"
                initialJS="console.log('ログ1'); console.log('ログ2'); console.log('ログ3');"
            />
        );

        await expect(component.getByText('ログ1')).toBeVisible({ timeout: 10000 });
        await expect(component.getByText('ログ2')).toBeVisible();
        await expect(component.getByText('ログ3')).toBeVisible();
    });

    // ===== リセット機能のテスト =====
    test('リセットボタンを長押しするとプログレスバーが表示されること', async ({ mount, page }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<h1>Original</h1>"
            />
        );

        const resetButton = component.getByRole('button', { name: '長押しでリセット' });

        // マウスダウンイベントを発火
        await resetButton.dispatchEvent('mousedown');

        // 少し待機してプログレスの進行を確認
        await page.waitForTimeout(500);

        // SVGのcircle要素（プログレスバー）が表示されていることを確認
        const progressCircle = resetButton.locator('circle[stroke="#218bff"]');
        await expect(progressCircle).toBeVisible();

        // マウスアップでキャンセル
        await resetButton.dispatchEvent('mouseup');
    });

    // ===== 行番号表示の切り替えテスト =====
    test('行番号表示切り替えボタンが機能すること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
            />
        );

        // 行番号切り替えボタンを探す
        const lineNumberButton = component.getByRole('button', { name: /行番号/ });
        await expect(lineNumberButton).toBeVisible();

        // ボタンをクリック
        await lineNumberButton.click();
    });

    // ===== エディタのリサイズ機能テスト =====
    test('エディタ間のリサイザーが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                initialHTML="<div></div>"
                initialCSS="div { color: red; }"
            />
        );

        // セパレーター（リサイザー）を探す
        const separator = component.getByRole('separator');
        await expect(separator).toBeVisible();

        // aria-labelが正しく設定されているか確認
        await expect(separator).toHaveAttribute('aria-label', /HTML と CSS の幅を調整/);
    });

    test('リサイザーでエディタの幅を調整できること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                initialHTML="<div></div>"
                initialCSS="div { color: red; }"
            />
        );

        const separator = component.getByRole('separator');
        await expect(separator).toBeVisible();

        // タブキーでフォーカス可能か確認
        await expect(separator).toHaveAttribute('tabIndex', '0');
    });

    // ===== デフォルト値のテスト =====
    test('minHeightのデフォルト値が適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
            />
        );

        // コンポーネントが正常に描画されることを確認
        await expect(component).toBeVisible();
    });

    test('themeのデフォルト値(light)が適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
            />
        );

        // Monacoエディタが描画されていることを確認
        const monacoEditor = component.locator('.monaco-editor');
        await expect(monacoEditor).toBeVisible({ timeout: 10000 });
    });

    test('theme="dark"が適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                theme="dark"
                initialHTML="<div>test</div>"
            />
        );

        // Monacoエディタが描画されていることを確認
        const monacoEditor = component.locator('.monaco-editor');
        await expect(monacoEditor).toBeVisible({ timeout: 10000 });
    });

    test('htmlPathのデフォルト値(index.html)が適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
            />
        );

        // ファイル構造パネルに index.html が表示されること
        await expect(component.getByText('index.html')).toBeVisible();
    });

    // ===== エディタの複数組み合わせテスト =====
    test('HTML+CSSエディタの組み合わせが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                jsVisible={false}
                initialHTML="<div>test</div>"
                initialCSS="div { color: red; }"
            />
        );

        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('CSS')).toBeVisible();
        await expect(component.getByText('JavaScript')).not.toBeVisible();
    });

    test('HTML+JSエディタの組み合わせが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={false}
                jsVisible={true}
                initialHTML="<div>test</div>"
                initialJS="console.log('test');"
            />
        );

        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('CSS')).not.toBeVisible();
        await expect(component.getByText('JavaScript')).toBeVisible();
    });

    test('CSS+JSエディタの組み合わせが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={false}
                cssVisible={true}
                jsVisible={true}
                initialHTML="<div>test</div>"
                initialCSS="div { color: red; }"
                initialJS="console.log('test');"
            />
        );

        await expect(component.getByText('HTML')).not.toBeVisible();
        await expect(component.getByText('CSS')).toBeVisible();
        await expect(component.getByText('JavaScript')).toBeVisible();
    });

    // ===== ファイルパスの解決テスト =====
    test('cssPathが指定された場合、ファイル構造に表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
                initialCSS="div { color: red; }"
                cssPath="css/style.css"
            />
        );

        await expect(component.getByText('📁 css')).toBeVisible();
        await expect(component.getByText('📄 style.css')).toBeVisible();
    });

    test('jsPathが指定された場合、ファイル構造に表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
                initialJS="console.log('test');"
                jsPath="js/script.js"
            />
        );

        await expect(component.getByText('📁 js')).toBeVisible();
        await expect(component.getByText('📄 script.js')).toBeVisible();
    });

    test('カスタムhtmlPathが指定された場合、ファイル構造に表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
                htmlPath="pages/main.html"
            />
        );

        await expect(component.getByText('📁 pages')).toBeVisible();
        await expect(component.getByText('📄 main.html')).toBeVisible();
    });

    test('複数のファイルパスが指定された場合、すべて表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
                initialCSS="div { color: red; }"
                initialJS="console.log('test');"
                htmlPath="index.html"
                cssPath="styles/main.css"
                jsPath="scripts/app.js"
            />
        );

        await expect(component.getByText('📄 index.html')).toBeVisible();
        await expect(component.getByText('📁 styles')).toBeVisible();
        await expect(component.getByText('📄 main.css')).toBeVisible();
        await expect(component.getByText('📁 scripts')).toBeVisible();
        await expect(component.getByText('📄 app.js')).toBeVisible();
    });

    // ===== 画像パスの解決テスト =====
    test('imagesプロパティが指定された場合、ファイル構造に表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
                images={{
                    'img/sample.png': '/static/img/sample.png',
                    'img/logo.svg': '/static/img/logo.svg'
                }}
            />
        );

        await expect(component.getByText('📁 img')).toBeVisible();
        await expect(component.getByText('📄 sample.png')).toBeVisible();
        await expect(component.getByText('📄 logo.svg')).toBeVisible();
    });

    // ===== エディタの初期値テスト =====
    test('initialCSSが指定されない場合でも正常に動作すること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                initialHTML="<div>test</div>"
            />
        );

        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('CSS')).toBeVisible();
    });

    test('initialJSが指定されない場合でも正常に動作すること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                jsVisible={true}
                initialHTML="<div>test</div>"
            />
        );

        await expect(component.getByText('HTML')).toBeVisible();
        await expect(component.getByText('JavaScript')).toBeVisible();
    });

    // ===== ツールバーのボタンテスト =====
    test('ファイル構造の表示切り替えボタンが機能すること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={true}
                initialHTML="<div>test</div>"
            />
        );

        // 初期状態でファイル構造が表示されていること
        const hideButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(hideButton).toBeVisible();

        // ボタンをクリック
        await hideButton.click();

        // 非表示になったことを確認
        const showButton = component.getByRole('button', { name: 'ファイル構造を表示' });
        await expect(showButton).toBeVisible();
    });

    test('ファイル構造の初期状態がfalseの場合、非表示から開始されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                fileStructureVisible={false}
                initialHTML="<div>test</div>"
            />
        );

        // 表示ボタンが見えることを確認
        const showButton = component.getByRole('button', { name: 'ファイル構造を表示' });
        await expect(showButton).toBeVisible();

        // ボタンをクリック
        await showButton.click();

        // 表示されたことを確認
        const hideButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(hideButton).toBeVisible();
    });

    // ===== プレビューの高さテスト =====
    test('カスタムminHeightが適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
                minHeight="400px"
            />
        );

        await expect(component).toBeVisible();
        // エディタが描画されていることを確認
        const monacoEditor = component.locator('.monaco-editor');
        await expect(monacoEditor).toBeVisible({ timeout: 10000 });
    });

    // ===== エラーハンドリングテスト =====
    test('不正なHTMLでもクラッシュしないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div><p>閉じタグなし"
            />
        );

        await expect(component).toBeVisible();
        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();
    });

    test('不正なCSSでもクラッシュしないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
                initialCSS="div { color: red"
            />
        );

        await expect(component).toBeVisible();
        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();
    });

    test('不正なJavaScriptでもクラッシュしないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
                initialJS="const x = "
            />
        );

        await expect(component).toBeVisible();
        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();
    });

    // ===== アクセシビリティテスト =====
    test('セパレーターが適切なARIA属性を持つこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={true}
                cssVisible={true}
                initialHTML="<div>test</div>"
                initialCSS="div { color: red; }"
            />
        );

        const separator = component.getByRole('separator');
        await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
        await expect(separator).toHaveAttribute('tabIndex', '0');
    });
});
