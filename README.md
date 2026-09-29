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
4. Leave the extension folder at a stable path. Edge keeps a locally loaded unpacked extension across browser restarts while Developer mode is enabled.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select `browsers/chrome`.

## Install in Firefox

Firefox's **Load Temporary Add-on** option removes the extension when Firefox closes. To keep it installed without a public listing, submit the package to Mozilla Add-ons (AMO), choose **On your own** for unlisted distribution, and download the Mozilla-signed `.xpi`. In Firefox, open `about:addons`, choose **Install Add-on From File** from the gear menu, and select the signed file. Unlisted updates must be installed manually unless you set up a signed self-hosted update feed.

## Vim engine and editor support

The extension bundles `monaco-vim` 0.4.2, which adapts CodeMirror's Vim keymap to Monaco. It supports composed motions and operators, counts, text objects, Visual modes, registers, dot-repeat, and Vim search/command-line behavior. It is not Neovim and does not load Neovim plugins or Lua configuration. Upstream notes some edge cases, especially Ex and search/replace commands.

On ImmyBot, a document-start preloader enables Monaco's supported `MonacoEnvironment.globalAPI` option before the VS Code workbench initializes. The bridge can then use the resulting public Monaco global without an AMD loader. This path is a best-effort compatibility change; it still needs a live ImmyBot reload and editor check before support is confirmed. Rewst and ImmyBot should be checked separately.

The bundled engine is from [brijeshb42/monaco-vim](https://github.com/brijeshb42/monaco-vim), released under MIT. The `monaco-vim` and CodeMirror license texts are included in each package.
