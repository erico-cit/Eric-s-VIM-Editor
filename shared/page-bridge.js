(() => {
  if (window.__monacoVimBridgeInstalled) return;
  window.__monacoVimBridgeInstalled = true;

  let enabled = true;
  let engineLoading = false;
  let engine = null;
  let loadError = "";
  let editorCount = 0;
  const editors = new Map();

  function publishStatus() {
    window.postMessage({
      source: "monaco-vim-page", type: "status",
      monaco: !!window.monaco?.editor, editors: editorCount, error: loadError
    }, "*");
  }

  function rememberOptions(editor) {
    const opt = window.monaco?.editor?.EditorOption;
    const values = {};
    try {
      if (opt?.cursorStyle !== undefined) values.cursorStyle = editor.getOption(opt.cursorStyle);
      if (opt?.cursorBlinking !== undefined) values.cursorBlinking = editor.getOption(opt.cursorBlinking);
      if (opt?.cursorWidth !== undefined) values.cursorWidth = editor.getOption(opt.cursorWidth);
    } catch (_) {}
    return values;
  }

  function setBadge(record, mode) {
    record.mode = mode;
    if (record.badge) record.badge.textContent = mode;
  }

  function detach(record) {
    if (record.vim) {
      try { record.vim.dispose(); } catch (_) {}
      record.vim = null;
    }
    if (record.keyListener) {
      record.keyListener.dispose();
      record.keyListener = null;
    }
    try { record.editor.updateOptions(record.originalOptions); } catch (_) {}
    setBadge(record, "NORMAL");
  }

  function attach(editor) {
    if (!editor || editors.has(editor) || !editor.getDomNode()) return;
    const badge = document.createElement("div");
    badge.textContent = enabled && !engine ? "VIM LOADING" : enabled ? "NORMAL" : "VIM OFF";
    badge.style.cssText = "position:absolute;right:10px;bottom:8px;z-index:1000;padding:2px 6px;border-radius:3px;background:#242832;color:#d7dae0;font:11px Segoe UI,Arial;pointer-events:none;opacity:.85";
    badge.hidden = !enabled;
    editor.getDomNode().appendChild(badge);
    const record = { editor, badge, mode: "NORMAL", originalOptions: rememberOptions(editor), vim: null, keyListener: null };
    editors.set(editor, record);
    editorCount = editors.size;
    if (enabled && engine) activate(record);
  }

  function ensureContextKeyApi(editor) {
    if (typeof editor.createContextKey === "function") return;

    // VS Code workbench editors omit Monaco's public context-key helper.
    // monaco-vim only uses this key internally to track insert mode, so a
    // local value object is sufficient and does not alter workbench bindings.
    let value = true;
    Object.defineProperty(editor, "createContextKey", {
      configurable: true,
      value(_key, defaultValue) {
        value = defaultValue;
        return {
          set(nextValue) { value = nextValue; },
          reset() { value = defaultValue; },
          get() { return value; },
        };
      },
    });
  }

  function activate(record) {
    if (!enabled || !engine || record.vim) return;
    // Register before monaco-vim so browser refresh is cancelled and Ctrl+R
    // remains Vim redo in NORMAL mode.
    record.keyListener = record.editor.onKeyDown((event) => {
      const e = event.browserEvent;
      if (e?.ctrlKey && !e.altKey && !e.metaKey && e.key?.toLowerCase() === "r") {
        e.preventDefault();
        e.stopPropagation();
        if (record.mode === "NORMAL") {
          try { record.editor.trigger("vim", "redo", null); } catch (_) {}
        }
      }
    });
    try {
      ensureContextKeyApi(record.editor);
      record.vim = engine.initVimMode(record.editor);
      record.vim.on("vim-mode-change", (state) => {
        const mode = state?.mode || "normal";
        setBadge(record, mode === "visual" && state.subMode ? `VISUAL ${state.subMode.toUpperCase()}` : mode.toUpperCase());
      });
      setBadge(record, "NORMAL");
    } catch (err) {
      record.keyListener?.dispose();
      record.keyListener = null;
      loadError = `Vim adapter failed: ${String(err?.message || err)}`;
      record.badge.textContent = "VIM ERROR";
      record.badge.title = loadError;
      publishStatus();
    }
  }

  function scan() {
    const monaco = window.monaco;
    if (monaco?.editor?.getEditors) monaco.editor.getEditors().forEach(attach);
    publishStatus();
  }

  function patch(monaco = window.monaco) {
    if (!monaco?.editor || monaco.editor.__monacoVimPatched) return;
    monaco.editor.__monacoVimPatched = true;
    const create = monaco.editor.create;
    monaco.editor.create = function (...args) {
      const editor = create.apply(this, args);
      attach(editor);
      return editor;
    };
  }

  function loadEngine() {
    if (!window.__monacoVimEngineDefined || engineLoading || engine) return;
    // Some VS Code workbenches expose Monaco's public API without an AMD loader.
    // The bundled UMD engine can use that global API directly.
    if (window.MonacoVim?.initVimMode) {
      engine = window.MonacoVim;
      loadError = "";
      patch();
      scan();
      for (const record of editors.values()) if (enabled) activate(record);
      publishStatus();
      return;
    }
    const req = window.require;
    // Monaco's AMDLoader exposes define.amd, while require.amd is absent on
    // some VS Code/Monaco loader builds (including Rewst's saved page).
    if (typeof req !== "function" || !(req.amd || window.define?.amd) || typeof req.config !== "function") return;
    engineLoading = true;
    loadError = "";
    try {
      req(["vs/editor/editor.main", "monaco-vim"], (_monaco, vimModule) => {
        engine = vimModule?.initVimMode ? vimModule : vimModule?.default;
        if (!engine?.initVimMode) {
          loadError = "The Monaco Vim module loaded without initVimMode.";
          for (const record of editors.values()) { record.badge.textContent = "VIM ERROR"; record.badge.title = loadError; }
        } else {
          loadError = "";
          patch();
          scan();
          for (const record of editors.values()) if (enabled) activate(record);
        }
        engineLoading = false;
        if (loadError) for (const record of editors.values()) { record.badge.textContent = "VIM ERROR"; record.badge.title = loadError; }
        publishStatus();
      }, (err) => {
        engineLoading = false;
        loadError = `Could not load Monaco Vim: ${String(err?.message || err)}`;
        for (const record of editors.values()) { record.badge.textContent = "VIM ERROR"; record.badge.title = loadError; }
        publishStatus();
      });
    } catch (err) {
      engineLoading = false;
      loadError = `Could not start Monaco Vim: ${String(err?.message || err)}`;
      for (const record of editors.values()) { record.badge.textContent = "VIM ERROR"; record.badge.title = loadError; }
      publishStatus();
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (data?.source === "monaco-vim-extension" && data.type === "set") {
      enabled = !!data.enabled;
      for (const record of editors.values()) {
        record.badge.hidden = !enabled;
        if (enabled) activate(record); else detach(record);
      }
      if (enabled) loadEngine();
      publishStatus();
    }
  });

  patch();
  scan();
  setTimeout(() => {
    if (engine || loadError || !window.monaco?.editor) return;
    loadError = !window.__monacoVimEngineDefined
      ? "Vim engine is waiting for the page's AMD loader."
      : window.monaco?.editor && window.MonacoVim?.initVimMode
        ? ""
      : typeof window.require !== "function" || !(window.require.amd || window.define?.amd)
        ? "Monaco AMD require/define was not found."
        : "Monaco Vim did not finish loading; reload the page and check the extension files.";
    for (const record of editors.values()) {
      if (record.mode === "VIM LOADING") { record.badge.textContent = "VIM ERROR"; record.badge.title = loadError; }
    }
    publishStatus();
  }, 12000);
  setInterval(() => {
    patch();
    scan();
    loadEngine();
  }, 800);
})();
