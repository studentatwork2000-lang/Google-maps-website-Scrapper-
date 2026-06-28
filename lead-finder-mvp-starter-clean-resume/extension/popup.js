const input = document.querySelector('#backendUrl');
chrome.storage.sync.get({ backendUrl: 'http://localhost:8787' }, (items) => { input.value = items.backendUrl; });
document.querySelector('#save').addEventListener('click', () => chrome.storage.sync.set({ backendUrl: input.value || 'http://localhost:8787' }));
