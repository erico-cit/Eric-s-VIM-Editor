# Monaco Vim Mode for Edge

Unpacked Microsoft Edge extension that attaches the `monaco-vim` Vim key engine to Monaco editors. Rewst and ImmyBot are included automatically because the extension runs on all web pages.

## Install

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Reload Rewst or ImmyBot after installation.

The toolbar popup toggles Vim mode for the current tab. The default shortcut is **Alt+Shift+V**; Edge lets you change it at `edge://extensions/shortcuts`. Reload the extension and the target page after installing or updating it.

## Vim engine

The extension bundles `monaco-vim` 0.4.2, which adapts CodeMirror's established Vim keymap to Monaco. This replaces the former hand-written command parser and brings composed motions and operators, counts, text objects, Visual modes, registers, dot-repeat, and Vim search/command-line behavior. It is not Neovim itself and does not load your Neovim plugins or Lua configuration. The upstream project notes that some commands which require extra input, especially Ex and search/replace, can still have edge cases.

The adapter registers with the page's AMD loader and uses the Monaco modules already loaded by the site. This is needed for Monaco internals used by the adapter. Editors discovered through `window.monaco.editor.getEditors()` and later `editor.create()` calls are attached. A page that hides Monaco in a closed shadow root, iframe, or module scope may not be detected. Rewst's supplied page exposes Monaco 0.39 and an AMD loader; the new engine integration still needs a live check in Rewst and ImmyBot.

The mode badge stays outside the editor text at the bottom-right of the Monaco window and is hidden when Vim mode is off. The cursor is a block in NORMAL mode. The browser-refresh guard still prevents Ctrl+R from reloading the page; when an editor is focused, the extension sends Ctrl+R to Monaco's redo action.

The bundled engine is from [brijeshb42/monaco-vim](https://github.com/brijeshb42/monaco-vim), released under MIT. The package and CodeMirror license texts are included beside the bundle.

This is a first pass; test with a noncritical editor before relying on editing commands.
