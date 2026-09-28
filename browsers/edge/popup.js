const toggle = document.querySelector("#toggle");
const status = document.querySelector("#status");
chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
  document.querySelector("#site").textContent = tab?.url ? new URL(tab.url).hostname : "Current tab";
  chrome.storage.local.get({ monacoVimEnabled: true }, ({ monacoVimEnabled }) => render(monacoVimEnabled));
  chrome.tabs.sendMessage(tab.id, { type: "status" }, (response) => {
    if (chrome.runtime.lastError) status.textContent = "Open or reload a supported page to connect.";
    else if (response?.error) status.textContent = response.error;
    else if (response?.editors) status.textContent = `${response.editors} Monaco editor(s) detected`;
    else if (response?.monaco) status.textContent = "Monaco loaded; no editor instance detected yet.";
    else status.textContent = "No Monaco instance detected. Reload this page after enabling the extension.";
  });
  toggle.addEventListener("click", () => chrome.tabs.sendMessage(tab.id, { type: "toggle" }, () => {
    chrome.storage.local.get({ monacoVimEnabled: true }, ({ monacoVimEnabled }) => render(monacoVimEnabled));
  }));
});
function render(on) { toggle.textContent = on ? "Vim mode: On" : "Vim mode: Off"; toggle.classList.toggle("off", !on); }
