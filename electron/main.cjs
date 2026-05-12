const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

const devServerUrl = process.env.ELECTRON_RENDERER_URL;

/**
 * Validates and constructs a Gmail compose URL.
 * @param {string} recipient - Email recipient address
 * @param {string} body - Email body content
 * @returns {string} Full Gmail compose URL
 * @throws {Error} If recipient is invalid
 */
function buildGmailUrl(recipient, body) {
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Invalid email recipient");
  }

  const subject = "Dear Redacted";
  const footnote = "\n\n---\nwrote with Dear Redacted Composer\nhttps://dear-redacted.github.io/composer/";
  const finalBody = body + footnote;

  const params = [`view=cm`, `fs=1`, `to=${encodeURIComponent(recipient)}`, `su=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(finalBody)}`].join("&");

  return `https://mail.google.com/mail/?${params}`;
}

// Remove default menu
Menu.setApplicationMenu(null);

// Disable unnecessary features for better startup and memory
app.commandLine.appendSwitch("disable-search-engine-choice-screen");
app.commandLine.appendSwitch("no-default-browser-check");

function createWindow() {
  const window = new BrowserWindow({
    show: false,
    minWidth: 960,
    minHeight: 720,
    backgroundColor: "#0D0D0D",
    icon: path.join(__dirname, "..", "public", "assets", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.once("ready-to-show", () => {
    window.show();
    window.maximize(); // 👈 this is what you want
  });

  if (devServerUrl) {
    window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  // --- NEW IPC HANDLERS FOR NATIVE FILE MANAGEMENT ---

  ipcMain.handle("dialog:openFile", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Open Document",
      properties: ["openFile"],
      filters: [
        { name: "Text Files", extensions: ["txt"] },
        { name: "Markdown", extensions: ["md"] },
        { name: "Python", extensions: ["py"] },
        { name: "HTML", extensions: ["html"] },
        { name: "JavaScript", extensions: ["js", "jsx"] },
        { name: "TypeScript", extensions: ["ts", "tsx"] },
        { name: "CSS", extensions: ["css"] },
        { name: "JSON", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (canceled || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const content = await fs.readFile(filePath, "utf8");
    return { filePath, content };
  });

  ipcMain.handle("dialog:saveFileAs", async (_event, content) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Document As",
      defaultPath: "Untitled.txt",
      filters: [
        { name: "Text Files", extensions: ["txt"] },
        { name: "Python", extensions: ["py"] },
        { name: "JavaScript", extensions: ["js"] },
        { name: "HTML", extensions: ["html"] },
        { name: "CSS", extensions: ["css"] },
        { name: "JSON", extensions: ["json"] },
        { name: "TypeScript", extensions: ["ts"] },
        { name: "Markdown", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (canceled || !filePath) return null;

    await fs.writeFile(filePath, content, "utf8");
    return filePath;
  });

  ipcMain.handle("dialog:saveFile", async (_event, { filePath, content }) => {
    await fs.writeFile(filePath, content, "utf8");
    return true;
  });

  ipcMain.on("window:setTitle", (event, title) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setTitle(title);
      // On macOS, this adds a native dot to the close button if unsaved
      win.setDocumentEdited(title.includes("*"));
    }
  });

  // Handle Gmail compose requests
  ipcMain.handle("open-gmail-compose", async (_event, { recipient, body }) => {
    try {
      if (!recipient || !body) {
        return {
          success: false,
          error: "Missing recipient or body"
        };
      }

      const url = buildGmailUrl(recipient, body);
      await shell.openExternal(url);
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
