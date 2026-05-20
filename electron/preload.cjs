const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "redactedComposer",
  Object.freeze({
    openGmailCompose: (recipient, body) =>
      ipcRenderer.invoke("open-gmail-compose", { recipient, body }),

    // New Native File System Exposures
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    saveFileAs: (content) => ipcRenderer.invoke("dialog:saveFileAs", content),
    saveFile: (filePath, content) =>
      ipcRenderer.invoke("dialog:saveFile", { filePath, content }),
    setWindowTitle: (title) => ipcRenderer.send("window:setTitle", title),
  }),
);
