chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ backendUrl: 'http://localhost:8787' });
});
