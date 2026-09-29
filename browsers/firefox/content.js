(() => {
  const key = "monacoVimEnabled";
  let enabled = true;
  let editorCount = 0;
  let monacoDetected = false;
  let engineError = "";
  let lastToggle = 0;
  function toggle() {
    const now = Date.now();
    if (now - lastToggle < 180) return;
    lastToggle = now;
    enabled = !enabled;
    chrome.storage.local.set({ [key]: enabled });
    window.postMessage({ source: "monaco-vim-extension", type: "set", enabled }, "*");
    const badge = document.createElement("div");
    badge.textContent = `Monaco Vim ${enabled ? "ON" : "OFF"} · ${editorCount} editor(s)`;
    badge.style.cssText = "position:fixed;z-index:2147483647;top:16px;right:16px;padding:10px 14px;background:#20242b;color:white;border:1px solid #697386;border-radius:6px;font:13px Segoe UI,Arial;box-shadow:0 3px 12px #0006;pointer-events:none";
    (document.documentElement || document).appendChild(badge);
    setTimeout(() => badge.remove(), 1800);
  }
  chrome.storage.local.get({ [key]: true }, (v) => {
    enabled = !!v[key];
    window.postMessage({ source: "monaco-vim-extension", type: "set", enabled }, "*");
  });
  chrome.storage.local.get({ monacoVimLineNumbers: "on" }, ({ monacoVimLineNumbers }) => {
    window.postMessage({ source: "monaco-vim-extension", type: "setLineNumbers", mode: monacoVimLineNumbers }, "*");
  });
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (msg.type === "status") { respond({ enabled, editors: editorCount, monaco: monacoDetected, error: engineError }); return true; }
    if (msg.type === "toggle") {
      toggle();
      respond({ enabled });
    }
    if (msg.type === "setLineNumbers") {
      window.postMessage({ source: "monaco-vim-extension", type: "setLineNumbers", mode: msg.mode }, "*");
      respond({ mode: msg.mode });
    }
  });
  // Fallback for Edge installations where the extension command is not
  // assigned or is intercepted. The timestamp guard avoids double toggling
  // when both this listener and chrome.commands receive the same key press.
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "v") {
      e.preventDefault(); e.stopImmediatePropagation(); toggle();
      return;
    }
    // Ctrl+R normally refreshes the tab. While Vim mode is enabled, cancel
    // that browser default; the page bridge handles redo when an editor is focused.
    if (enabled && e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === "r") e.preventDefault();
  }, true);
  window.addEventListener("message", (e) => {
    if (e.source === window && e.data?.source === "monaco-vim-page" && e.data.type === "status") {
      editorCount = e.data.editors;
      monacoDetected = e.data.monaco;
      engineError = e.data.error || "";
    }
  });
})();
