# History Around - Web Frontend

This is the React frontend for the History Around application. It is built with Vite, React, and TypeScript.

## 🏗️ Project Structure

```
src/
├── Components/        # Reusable UI components
│   ├── UnityPlayer.tsx    # Unity WebGL integration component
│   ├── Welcome Splash.tsx # Loading screen and start button
│   ├── Header.tsx         # Navigation header
│   └── Footer.tsx         # Site footer
├── Pages/             # Route pages
│   ├── Home.tsx           # Main game page
│   ├── About.tsx          # About information
│   └── Contacts.tsx       # Contact information
├── hooks/             # Custom React hooks
│   └── useUnityLoader.ts  # Hook for Unity loading state management
├── CSS/               # Stylesheets
└── main.tsx           # Application entry point
```

## 🎮 Unity Integration

The application integrates a Unity WebGL game using an `iframe` approach:

1.  **UnityPlayer Component**: Embeds `unity-game.html` in an iframe.
2.  **Communication**: Uses `postMessage` API to communicate between React and Unity.
    *   **Loading Progress**: Unity sends progress updates to React.
    *   **Resizing**: React sends resize commands to Unity.
3.  **Loader**: `useUnityLoader` hook listens for messages and manages the loading state (progress bar, error handling).

### Resizing Controls
The `UnityPlayer` component supports:
-   **Auto-resize**: Automatically fits the container.
-   **Presets**: Mobile, Tablet, Desktop, Widescreen.
-   **Fullscreen**: Toggles fullscreen mode.

## 🚀 Development

### Install Dependencies
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
```
*Note: The Unity game might not load correctly in dev mode if the backend server is not running or if `.br` files are not served with correct headers.*

### Build for Production
```bash
npm run build
```
This generates the `dist/` folder, which is then copied to the backend `public/` folder for deployment.

## 📦 Deployment

The deployment process is handled by the backend scripts:
1.  `npm run build` (Frontend)
2.  `npm run copy-build` (Backend script copies `dist/` to `Back-End/public/`)
