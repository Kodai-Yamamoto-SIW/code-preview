## ルール運用

### 対象範囲

スコープ: このフォルダ配下全体（下位の `AGENTS.md` がある場合は、そちらが優先）。

## このリポジトリについて（@metyatech/code-preview）

このリポジトリは、Docusaurus 等で利用するための **React + TypeScript** 製のコードプレビューライブラリ。

## 技術スタック

- 言語: TypeScript（`strict` 前提）
- UI: React（>= 18）
- ビルド: Rollup
- スタイル: CSS Modules（`*.module.css`）
- エディタ: Monaco Editor（`@monaco-editor/react`）

## 実装方針

- クラスコンポーネントは使わず、関数コンポーネントと Hooks で実装する。
- `useEffect` は必要最小限にし、依存配列を正しく設定する。
- ユーザー入力（HTML/CSS/JS）は信頼できない前提で扱い、プレビュー生成で例外が起きても全体がクラッシュしないように守る（`try/catch` や Error Boundary を検討）。

## TypeScript / 型

- `any` は原則禁止。不明な型は `unknown` を使い、型ガードで絞り込む。
- `React.FC` は使わず、通常の関数宣言 / 変数宣言でコンポーネントを定義する。
- コンポーネント Props は `interface` で定義し、公開 API になるものは JSDoc を付ける。

## スタイリング（CSS Modules）

- CSS Modules を使い、スタイルの衝突を避ける。
- クラス名はキャメルケース（例: `.container`, `.activeTab`）を推奨し、JS 側は `styles.container` のように参照する。

## テスト / 品質

- テストは Playwright Component Testing を使用する。
- 挙動が変わる変更（仕様追加/変更/バグ修正/リファクタ等）では、対応する `*.spec.tsx` を追加・更新する。
- Playwright CT では 1 テスト内で `mount()` は 1 回まで（複数シナリオはテストを分割する）。
