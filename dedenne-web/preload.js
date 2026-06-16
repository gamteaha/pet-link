const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  loadPetlinkFile: () => ipcRenderer.invoke('load-petlink-file'),
  // 가방 / 인벤토리 관련
  loadPetData: () => ipcRenderer.invoke('load-pet-data'),
  savePetData: (data) => ipcRenderer.invoke('save-pet-data', data),
  // 우클릭 메뉴
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  // 가방 창 토글
  onToggleBag: (callback) => ipcRenderer.on('toggle-bag', (_event) => callback()),
});
