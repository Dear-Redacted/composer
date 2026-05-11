module.exports = {
  appId: "com.dearredacted.composer",
  productName: "Dear Redacted Composer",
  directories: {
    output: "release",
  },
  compression: "normal",
  electronLanguages: ["en-US"],
  asar: {
    smartUnpack: true,
  },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  asarUnpack: ["**/*.node", "resources/**"],
  win: {
    target: ["portable", "nsis"], // Build portable and installer
    icon: "public/assets/favicon.ico",
    signAndEditExecutable: false,
  },
  nsis: {
    oneClick: false, // Show next/back buttons instead of auto-install
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    artifactName: "${productName}-${version}-installer.${ext}",
  },
  portable: {
    artifactName: "${productName}-${version}-${arch}.${ext}",
  },
};
