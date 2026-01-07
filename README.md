# @metyatech/code-preview

A React + TypeScript component for editing HTML/CSS/JS with a live iframe preview and console output. It is used in Docusaurus course content, but works in any React app.

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

```tsx
import { CodePreview } from '@metyatech/code-preview';
import '@metyatech/code-preview/styles.css';

export default function Example() {
  return (
    <CodePreview
      title="Basic Example"
      initialHTML={`<button id="btn">Click me</button>`}
      initialCSS={`#btn { padding: 8px 12px; }`}
      initialJS={`document.getElementById('btn')?.addEventListener('click', () => {
  console.log('clicked');
});`}
      minHeight="240px"
    />
  );
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `initialHTML` | `string` | `undefined` | HTML inserted into `<body>`. When provided, the HTML editor is shown by default. |
| `initialCSS` | `string` | `undefined` | CSS editor is shown by default when provided. |
| `initialJS` | `string` | `undefined` | JS editor is shown by default when provided. |
| `title` | `string` | `undefined` | Header title shown above the editor layout. |
| `minHeight` | `string` | `"200px"` | Minimum height for editors and preview. |
| `theme` | `"light" \| "dark"` | `"light"` | Monaco theme mapping (`"dark"` uses `vs-dark`). |
| `htmlVisible` | `boolean` | auto | Force HTML editor visibility. |
| `cssVisible` | `boolean` | auto | Force CSS editor visibility. |
| `jsVisible` | `boolean` | auto | Force JS editor visibility. |
| `previewVisible` | `boolean` | auto | Force preview visibility (default follows HTML editor). |
| `consoleVisible` | `boolean` | auto | Force console visibility (default shows when logs exist). |
| `fileStructureVisible` | `boolean` | auto | Initial file structure visibility (default: `true` when `images` is set, otherwise `false`). |
| `sourceId` | `string` | `undefined` | Share sources across instances on the same page. |
| `htmlPath` | `string` | `"index.html"` | Virtual HTML file path for the file structure panel. |
| `cssPath` | `string` | `undefined` | Virtual CSS path for file structure and `url(...)` resolution. |
| `jsPath` | `string` | `undefined` | Virtual JS path for file structure and script injection. |
| `images` | `Record<string, string>` | `undefined` | Map of virtual image paths to real URLs. |
| `imageBasePath` | `string` | `undefined` | Base path used for HTML `src`/`href`/`srcset` when not covered by `images`. |
| `editorOptions` | `editor.IEditorConstructionOptions` | `undefined` | Monaco editor options merged with defaults. |

## Behavior notes

### Visibility rules

- Editors are shown automatically only when the matching `initial*` prop is provided. Use `htmlVisible`, `cssVisible`, or `jsVisible` to force visibility.
- Preview visibility follows the HTML editor by default. Use `previewVisible={false}` to hide it.
- Console is shown only when logs exist, unless `consoleVisible` forces it on or off.

### Virtual file paths and asset resolution

- `htmlPath`, `cssPath`, and `jsPath` are displayed in the file structure panel.
- If `cssPath` is provided and your HTML includes a matching `<link rel="stylesheet" href="...">`, the CSS is inlined for the preview.
- If `jsPath` is provided and your HTML includes a matching `<script src="..."></script>`, the JS is inlined. Otherwise, JS is appended at the end of `<body>`.
- `images` provides a virtual file map. HTML `src`/`href`/`srcset` and CSS `url(...)` are resolved against that map. CSS resolution uses `cssPath` as the base when provided.
- `imageBasePath` rewrites HTML `src`/`href`/`srcset` that are not in the `images` map.

Example using virtual paths and assets:

```tsx
<CodePreview
  initialHTML={`<link rel="stylesheet" href="css/style.css">
<img src="img/logo.png" />
<script src="js/app.js"></script>`}
  initialCSS={`img { width: 120px; }`}
  initialJS={`console.log('ready');`}
  cssPath="css/style.css"
  jsPath="js/app.js"
  images={{ 'img/logo.png': '/static/img/logo.png' }}
/>;
```

### Sharing code with `sourceId`

- Instances with the same `sourceId` share HTML/CSS/JS and file paths on the same page (`window.location.pathname`).
- The first instance that provides `initialHTML`/`initialCSS`/`initialJS` becomes the source provider. Avoid providing initial code in later instances unless you want to override the shared values.

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

## Environment variables

None.

## Release

```bash
npm publish
```

## License

MIT
