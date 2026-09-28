chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-vim") return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id != null) chrome.tabs.sendMessage(tab.id, { type: "toggle" }).catch(() => {});
});
