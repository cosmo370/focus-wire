# Focus Wire

Focus Wire is a small, always-on-top desktop to-do list and focus timer. During a focus session it hides the task list and shows a bomb-inspired countdown. When the countdown ends, it asks whether you finished the task.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer

Install pnpm with Corepack if needed:

```sh
corepack enable
corepack prepare pnpm@10.34.3 --activate
```

## Run in development

```sh
pnpm install --frozen-lockfile
pnpm desktop:dev
```

The app opens in an Electron window. Close the window to stop it.

## Build for your operating system

Run this on the operating system you want to build for:

```sh
pnpm install --frozen-lockfile
pnpm desktop:build
```

- **Windows:** creates an x64 NSIS installer in `release/`.
- **Linux:** creates x64 AppImage and Debian `.deb` packages in `release/`.

The Windows installer and executable are unsigned. Windows Smart App Control may block them because they do not have a trusted code-signing certificate. There is no per-app Smart App Control exception. You can also run the development version with `pnpm desktop:dev`.

## Linux use

Build the Linux packages on a Linux machine; the build script targets the current operating system and does not cross-compile. For an AppImage, make it executable and launch it:

```sh
chmod +x "release/Focus Wire-1.0.0.AppImage"
"release/Focus Wire-1.0.0.AppImage"
```

The exact generated filename includes the version. Alternatively, install the generated Debian package on Debian or Ubuntu:

```sh
sudo apt install ./release/focus-wire_1.0.0_amd64.deb
```

Linux desktop environments differ in how they handle frameless, transparent, always-on-top windows. X11 generally gives the app more predictable positioning; Wayland compositors may restrict window placement or stacking. The widget tries to open near the bottom-left of the usable screen area.

## Web app

To run only the browser version:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite.
