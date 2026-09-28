(() => {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname !== "immy.bot" && !hostname.endsWith(".immy.bot")) return;

  const existing = window.MonacoEnvironment;
  const environment = existing && (typeof existing === "object" || typeof existing === "function")
    ? existing
    : {};

  try {
    environment.globalAPI = true;
  } catch (_) {}

  const descriptor = Object.getOwnPropertyDescriptor(window, "MonacoEnvironment");
  if (descriptor?.configurable === false) return;

  try {
    Object.defineProperty(window, "MonacoEnvironment", {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get: () => environment,
      set: (value) => {
        if (value && (typeof value === "object" || typeof value === "function")) {
          try { Object.assign(environment, value); } catch (_) {}
        }
        try { environment.globalAPI = true; } catch (_) {}
      },
    });
  } catch (_) {}
})();
