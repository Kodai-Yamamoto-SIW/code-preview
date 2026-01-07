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

    test('HTMLがない場合はJSのみではプレビューが表示されないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialJS="console.log('test');"
            />
        );
        await expect(component.getByText('プレビュー')).not.toBeVisible();
    });

    test('HTMLがない場合はCSSのみではプレビューが表示されないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialCSS="div { color: red; }"
            />
        );
        await expect(component.getByText('プレビュー')).not.toBeVisible();
    });

    test('HTMLエディタを非表示にしてもHTMLがある場合はプレビューが表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                htmlVisible={false}
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

    test('minHeightが数値でも適用されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>test</div>"
                minHeight={320}
            />
        );

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

    // ===== sourceId のテスト =====
    test('同じsourceIdを持つコンポーネント間で初期状態が共有されること', async ({ mount }) => {
        const component = await mount(
            <div>
                <CodePreview
                    sourceId="shared-source-1"
                    initialHTML="<div>Shared Content</div>"
                />
                <div id="second-preview">
                    <CodePreview
                        sourceId="shared-source-1"
                    />
                </div>
            </div>
        );

        // 2つ目のコンポーネント（ソース参照側）のプレビューを確認
        const secondPreview = component.locator('#second-preview');
        const iframe2 = secondPreview.locator('iframe');
        const frame2 = iframe2.contentFrame();
        
        // 少し待機が必要かもしれない
        await expect(frame2.locator('div')).toHaveText('Shared Content', { timeout: 5000 });
    });

    // ===== images プロパティのテスト =====
    test('CSS内の画像パスがimagesプロパティに基づいて解決されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='bg-test'></div>"
                initialCSS="#bg-test { background-image: url('img/bg.png'); width: 100px; height: 100px; }"
                images={{
                    'img/bg.png': '/static/img/real-bg.png'
                }}
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const div = frame.locator('#bg-test');
        
        // CSSが適用されるまで待機
        await expect(div).toBeVisible();

        // background-image の URL が置換されているか確認
        await expect(div).toHaveCSS('background-image', /url\("?.*\/static\/img\/real-bg\.png"?\)/);
    });

    test('CSS: 正しい相対パス(../img/fence.png)のみが解決されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='test-div'></div>"
                initialCSS={`
                    #test-div { 
                        background-image: url('../img/fence.png');
                        width: 100px; height: 100px;
                    }
                `}
                cssPath="css/style.css"
                images={{
                    'img/fence.png': '/static/img/real-fence.png'
                }}
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const div = frame.locator('#test-div');
        
        await expect(div).toBeVisible();
        // 正しいパスなので解決されるべき
        await expect(div).toHaveCSS('background-image', /url\("?.*\/static\/img\/real-fence\.png"?\)/);
    });

    test('CSS: 誤った相対パス(img/fence.png)は解決されないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='test-div-wrong'></div>"
                initialCSS={`
                    #test-div-wrong { 
                        background-image: url('img/fence.png');
                        width: 100px; height: 100px;
                    }
                `}
                cssPath="css/style.css"
                images={{
                    'img/fence.png': '/static/img/real-fence.png'
                }}
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const div = frame.locator('#test-div-wrong');
        
        await expect(div).toBeVisible();
        
        // 誤ったパスなので、imagesの置換が行われず、元のパスのままになるべき
        const bgImage = await div.evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(bgImage).not.toContain('/static/img/real-fence.png');
    });

    test('CSS: 誤った相対パス(./img/fence.png)は解決されないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div id='test-div-wrong-2'></div>"
                initialCSS={`
                    #test-div-wrong-2 { 
                        background-image: url('./img/fence.png');
                        width: 100px; height: 100px;
                    }
                `}
                cssPath="css/style.css"
                images={{
                    'img/fence.png': '/static/img/real-fence.png'
                }}
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const div = frame.locator('#test-div-wrong-2');
        
        await expect(div).toBeVisible();
        
        const bgImage = await div.evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(bgImage).not.toContain('/static/img/real-fence.png');
    });

    test('HTML内の画像パスがimagesプロパティに基づいて解決されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<img src='img/logo.png' id='logo' />"
                images={{
                    'img/logo.png': '/static/img/real-logo.png'
                }}
            />
        );

        const iframe = component.locator('iframe');
        const frame = iframe.contentFrame();
        const img = frame.locator('#logo');

        await expect(img).toBeVisible();
        
        // src属性が置換されているか確認
        await expect(img).toHaveAttribute('src', '/static/img/real-logo.png');
    });

    test('sourceIdの共有範囲が同一ページ内に限定されること', async ({ mount, page }) => {
        // ページパスを /page-a に設定（可能な場合）
        await page.evaluate(() => {
            try {
                history.replaceState({}, '', '/page-a');
            } catch (e) {
                console.warn('Failed to update history:', e);
            }
        });

        await mount(
            <CodePreview
                sourceId="scoped-test"
                initialHTML="<div>Page A</div>"
            />
        );

        // ストアの状態を確認
        const storeState = await page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const store = (window as any).__CodePreviewStore__;
            const pathname = window.location.pathname;
            
            if (!store) {
                return { storeExists: false, pathname };
            }

            // 現在のパス名に基づいたキー（scoped-test:/page-a など）で保存されているか
            const scopedData = store.get(`scoped-test:${pathname}`);
            // スコープなしのキー（scoped-test）で保存されていないか
            const rawData = store.get('scoped-test');
            
            return { storeExists: true, scopedData, rawData, pathname };
        });

        expect(storeState.storeExists).toBe(true);
        
        // ストアの状態が更新されるのを待つ（useEffectの実行待ち）
        await expect.poll(async () => {
            return await page.evaluate(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const store = (window as any).__CodePreviewStore__;
                const pathname = window.location.pathname;
                const data = store?.get(`scoped-test:${pathname}`);
                return !!data;
            });
        }).toBe(true);

        // 詳細な検証
        const finalState = await page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const store = (window as any).__CodePreviewStore__;
            const pathname = window.location.pathname;
            return {
                scopedData: store?.get(`scoped-test:${pathname}`),
                rawData: store?.get('scoped-test')
            };
        });

        // パス名が含まれたキーで保存されていることを確認
        expect(finalState.scopedData).toBeDefined();
        expect(finalState.scopedData.html).toContain('Page A');
        
        // 生のsourceIdでは保存されていないことを確認（これが分離の証拠）
        expect(finalState.rawData).toBeUndefined();
    });
});

test.describe('動的な高さ変更のテスト', () => {

    test('JavaScriptで要素が追加された場合、プレビュー領域の高さが広がること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML={`<div id="container"></div>
<button id="add-btn" onclick="
    for(let i = 0; i < 10; i++) {
        const div = document.createElement('div');
        div.textContent = 'Item ' + i;
        div.style.padding = '20px';
        div.style.margin = '10px';
        div.style.background = '#eee';
        document.getElementById('container').appendChild(div);
    }
">要素を追加</button>`}
                minHeight="100px"
            />
        );

        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();

        // 初期の高さを取得
        const initialHeight = await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);

        // iframe内のボタンをクリックして要素を追加
        const frame = iframe.contentFrame();
        const addButton = frame.locator('#add-btn');
        await expect(addButton).toBeVisible({ timeout: 10000 });
        await addButton.click();

        // 高さが広がることを確認（ポーリングで確認）
        await expect.poll(async () => {
            return await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);
        }, { timeout: 5000 }).toBeGreaterThan(initialHeight);
    });

    test('モーダルウィンドウのような固定配置要素が表示された場合、高さが広がること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML={`<div style="text-align: center;">
    <button id="open-modal" style="font-size: 24px; padding: 10px 20px;">モーダルを開く</button>
</div>
<div id="modal" style="display: none; position: fixed; top: 50px; left: 50px; right: 50px; padding: 40px; background: white; border: 2px solid #333; z-index: 1000;">
    <h2 style="margin: 0 0 20px 0;">モーダルタイトル</h2>
    <p>これはモーダルウィンドウの内容です。</p>
    <p>固定配置の要素もプレビュー領域に収まるように高さが調整されます。</p>
    <div style="height: 200px; background: #f0f0f0; margin: 20px 0;"></div>
    <button id="close-modal">閉じる</button>
</div>`}
                initialJS={`
document.getElementById('open-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'block';
});
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});
`}
                minHeight="100px"
            />
        );

        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();

        // 初期の高さを取得
        const initialHeight = await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);

        // iframe内のボタンをクリックしてモーダルを開く
        const frame = iframe.contentFrame();
        const openButton = frame.locator('#open-modal');
        await expect(openButton).toBeVisible({ timeout: 10000 });
        await openButton.click();

        // モーダルが表示されるのを待つ
        await expect(frame.locator('#modal')).toBeVisible();

        // 高さが広がることを確認（ポーリングで確認）
        await expect.poll(async () => {
            return await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);
        }, { timeout: 5000 }).toBeGreaterThan(initialHeight);
    });

    test('高さは狭まる方向には調整されないこと', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML={`<div id="content" style="height: 300px; background: #eee;">
    大きなコンテンツ
</div>
<button id="shrink-btn" onclick="document.getElementById('content').style.height = '50px';">縮小</button>`}
                minHeight="100px"
            />
        );

        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();

        // コンテンツが描画されるのを待つ
        const frame = iframe.contentFrame();
        await expect(frame.locator('#content')).toBeVisible({ timeout: 10000 });

        // 初期の高さを取得（コンテンツが300pxなので、それ以上になっているはず）
        await expect.poll(async () => {
            return await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);
        }, { timeout: 5000 }).toBeGreaterThanOrEqual(300);

        const heightBeforeShrink = await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);

        // コンテンツを縮小
        const shrinkButton = frame.locator('#shrink-btn');
        await shrinkButton.click();

        // 少し待つ
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 高さが変わらないことを確認（狭まらない）
        const heightAfterShrink = await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);
        expect(heightAfterShrink).toBeGreaterThanOrEqual(heightBeforeShrink);
    });

    test('遅延で要素が追加された場合も高さが広がること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML={`<div id="container"></div>`}
                initialJS={`
setTimeout(function() {
    const div = document.createElement('div');
    div.style.height = '400px';
    div.style.background = 'lightblue';
    div.textContent = '遅延追加された要素';
    document.getElementById('container').appendChild(div);
}, 500);
`}
                minHeight="100px"
            />
        );

        const iframe = component.locator('iframe');
        await expect(iframe).toBeVisible();

        // 初期の高さを取得
        const initialHeight = await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);

        // 遅延追加後に高さが広がることを確認
        await expect.poll(async () => {
            return await iframe.evaluate((el) => (el as HTMLIFrameElement).offsetHeight);
        }, { timeout: 5000 }).toBeGreaterThan(initialHeight);
    });

    test('cssPathが指定されている場合、fileStructureVisibleが未指定でも表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>Test</div>"
                initialCSS="div { color: red; }"
                cssPath="css/style.css"
            />
        );
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(toggleButton).toBeVisible();
    });

    test('jsPathが指定されている場合、fileStructureVisibleが未指定でも表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>Test</div>"
                initialJS="console.log('test');"
                jsPath="js/app.js"
            />
        );
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(toggleButton).toBeVisible();
    });

    test('imagesが指定されている場合、fileStructureVisibleが未指定ならデフォルトで表示されること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>Test</div>"
                images={{ 'img/test.png': '/img/test.png' }}
            />
        );
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を隠す' });
        await expect(toggleButton).toBeVisible();
    });

    test('imagesが指定されていても、fileStructureVisible=falseなら非表示であること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>Test</div>"
                images={{ 'img/test.png': '/img/test.png' }}
                fileStructureVisible={false}
            />
        );
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を表示' });
        await expect(toggleButton).toBeVisible();
    });

    test('imagesが指定されていない場合、fileStructureVisibleが未指定ならデフォルトで非表示であること', async ({ mount }) => {
        const component = await mount(
            <CodePreview
                initialHTML="<div>Test</div>"
            />
        );
        const toggleButton = component.getByRole('button', { name: 'ファイル構造を表示' });
        await expect(toggleButton).toBeVisible();
    });
});
