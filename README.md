# @metyatech/code-preview

A React + TypeScript component for editing HTML/CSS/JS with a live iframe preview and console output. It works in any React app.

## Features

- Monaco editor panels for HTML, CSS, and JavaScript (shown only when enabled)
- Live preview rendered in a sandboxed iframe (`srcDoc`)
- Console panel that captures `console.log`, `console.error`, and runtime errors
- File structure panel for virtual file paths and image assets
- Resizable editor columns (drag, keyboard arrows, double-click or Enter/Space to reset)
- Toolbar controls: long-press reset, line numbers toggle, file structure toggle
- Auto sizing for editors and preview (grows with content, respects `minHeight`)

## Installation

```bash
npm i @metyatech/code-preview
```

## Quick start

````mdx
import { CodePreview } from '@metyatech/code-preview';

<CodePreview title="Basic Example" minHeight="240px">
```html
<button id="btn">Click me</button>
```

```css
#btn { padding: 8px 12px; }
```

```javascript
document.getElementById('btn')?.addEventListener('click', () => {
  console.log('clicked');
});
```
</CodePreview>
````

Styles are injected automatically; no stylesheet import is required.

### Next.js App Router

When using server component environments (such as the Next.js App Router), import from the client entry:

```tsx
import { CodePreview } from '@metyatech/code-preview/client';
```

## Props

| Prop                   | Type                     | Default        | Notes                                                                                         |
| ---------------------- | ------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| `children`             | `ReactNode`              | `undefined`    | One or more fenced code blocks with `html`, `css`, `js`, or `javascript` language labels.     |
| `title`                | `string`                 | `undefined`    | Header title shown above the editor layout.                                                   |
| `minHeight`            | `number \| string`       | `"200px"`      | Minimum height for editors and preview. Numbers are treated as px.                            |
| `theme`                | `"light" \| "dark"`      | `"light"`      | Monaco theme mapping (`"dark"` uses `vs-dark`).                                               |
| `htmlVisible`          | `boolean`                | auto           | Force HTML editor visibility.                                                                 |
| `cssVisible`           | `boolean`                | auto           | Force CSS editor visibility.                                                                  |
| `jsVisible`            | `boolean`                | auto           | Force JS editor visibility.                                                                   |
| `previewVisible`       | `boolean`                | auto           | Force preview visibility (default shows when HTML exists or HTML editor is forced on).        |
| `consoleVisible`       | `boolean`                | auto           | Force console visibility (default shows when logs exist).                                     |
| `fileStructureVisible` | `boolean`                | auto           | Initial file structure visibility (default: `true` when file paths or `images` are provided). |
| `sourceId`             | `string`                 | `undefined`    | Share sources across instances on the same page.                                              |
| `share`                | `boolean`                | `true`         | When `false`, this instance does not write its initial sources to the shared store.           |
| `htmlPath`             | `string`                 | `"index.html"` | Virtual HTML file path for the file structure panel.                                          |
| `cssPath`              | `string`                 | `undefined`    | Virtual CSS path for file structure and `url(...)` resolution.                                |
| `jsPath`               | `string`                 | `undefined`    | Virtual JS path for file structure and script injection.                                      |
| `images`               | `Record<string, string>` | `undefined`    | Map of virtual image paths to real URLs.                                                      |

## Behavior notes

### Visibility rules

- Editors are shown automatically only when the matching code block is provided. Use `htmlVisible`, `cssVisible`, or `jsVisible` to force visibility.
- Preview is shown when HTML exists or the HTML editor is forced on. Use `previewVisible={false}` to hide it.
- Console is shown only when logs exist, unless `consoleVisible` forces it on or off.

### Code block handling

- The first code block found for each language is used as the initial source.
- Multi-line blocks have leading/trailing blank lines trimmed and common indentation stripped.
- Single-line blocks are left as-is, and editors append a trailing newline when missing.

### Virtual file paths and asset resolution

- `htmlPath`, `cssPath`, and `jsPath` are displayed in the file structure panel.
- If `cssPath` is provided and your HTML includes a matching `<link rel="stylesheet" href="...">`, the CSS is inlined for the preview.
- If `jsPath` is provided and your HTML includes a matching `<script src="..."></script>`, the JS is inlined. Otherwise, JS is appended at the end of `<body>`.
- `images` provides a virtual file map. HTML `src`/`srcset` and CSS `url(...)` are resolved against that map. HTML resolution uses `htmlPath`, CSS resolution uses `cssPath`.

Example using virtual paths and assets:

````mdx
<CodePreview
  cssPath="css/style.css"
  jsPath="js/app.js"
  images={{ 'img/logo.png': '/static/img/logo.png' }}
>
```html
<link rel="stylesheet" href="css/style.css">
<img src="img/logo.png" />
<script src="js/app.js"></script>
```

```css
img { width: 120px; }
```

```javascript
console.log('ready');
```
</CodePreview>
````

### Sharing code with `sourceId`

- Instances with the same `sourceId` share HTML/CSS/JS, file paths, and images on the same page (`window.location.pathname`).
- The first instance that provides code blocks (and has `share` enabled) becomes the source provider. Avoid providing initial code in later instances unless you want to override the shared values.
- Partial overrides are supported: later instances can provide only HTML, only CSS, only JS, or any combination. Only the provided languages override the shared values; omitted languages keep their existing shared content.
- Providing an empty code block clears that language for the shared source.
- Use `share={false}` when you want local overrides (including `images` or paths) without updating the shared store.

### Editor and preview sizing

- Editor height is calculated from content and clamped to a max of 600px.
- Preview height grows as content expands and is clamped to a max of 800px. It does not automatically shrink.

### Reset and resizing controls

- The reset button requires a long press (500ms) and resets code, console logs, and the iframe.
- Resizers can be dragged with the mouse, adjusted via arrow keys, and reset to auto sizing by double-clicking or pressing Enter/Space.
- Line numbers are hidden by default and can be toggled in the toolbar.

## Development

- `npm run build`: build with Rollup
- `npm run lint`: lint
- `npm run test`: Playwright component tests (Chromium and full)
- If Playwright fails to start due to cache issues, run `npm run test-ct:clean` and retry.

## AGENTS.md

This project uses `agent-rules` and `agent-rules-tools` as git submodules.
After cloning, initialize submodules:

```bash
git submodule update --init --recursive
```

Update `agent-ruleset.json` as needed and regenerate:

```bash
node agent-rules-tools/tools/compose-agents.cjs
```

## Environment variables

None.

## Release

```bash
npm publish
```

## License

MIT
