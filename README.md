# Eric's VIM Editor

Browser extension that attaches the bundled `monaco-vim` key engine to Monaco editors. The shared source of truth is in `shared/`. Browser-ready packages are generated under `browsers/`:

- Edge: `browsers/edge`
- Chrome: `browsers/chrome`
- Firefox: `browsers/firefox`

Run `./build.ps1` after changing shared files to refresh all three packages. To build just one, run `./build.ps1 -Browser edge` (or `chrome` / `firefox`). The toolbar popup toggles Vim mode for the current tab. The default shortcut is **Alt+Shift+V**; each browser lets you change it in the extension shortcut settings. Reload the target page after installation or updates.

## Install in Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select `browsers/edge`.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select `browsers/chrome`.

## Install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…** and select `browsers/firefox/manifest.json`.
3. Temporary add-ons are removed when Firefox closes. For regular use or public distribution, package and sign the extension through Mozilla Add-ons.

## Vim engine and editor support

The extension bundles `monaco-vim` 0.4.2, which adapts CodeMirror's Vim keymap to Monaco. It supports composed motions and operators, counts, text objects, Visual modes, registers, dot-repeat, and Vim search/command-line behavior. It is not Neovim and does not load Neovim plugins or Lua configuration. Upstream notes some edge cases, especially Ex and search/replace commands.

On ImmyBot, a document-start preloader enables Monaco's supported `MonacoEnvironment.globalAPI` option before the VS Code workbench initializes. The bridge can then use the resulting public Monaco global without an AMD loader. This path is a best-effort compatibility change; it still needs a live ImmyBot reload and editor check before support is confirmed. Rewst and ImmyBot should be checked separately.

The bundled engine is from [brijeshb42/monaco-vim](https://github.com/brijeshb42/monaco-vim), released under MIT. The `monaco-vim` and CodeMirror license texts are included in each package.
