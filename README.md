# 2048 - Farcaster Mini App

This is a version of the classic 2048 game, built as a Mini App to be embedded and played directly on Farcaster-compatible clients.

## ✨ Features

-   **Classic 2048 Gameplay:** Move tiles to merge them and reach the 2048 tile.
-   **Flexible Controls:** Supports both keyboard (arrow keys, WASD) and touch screen swipe gestures.
-   **Responsive Design:** Works smoothly on both desktop and mobile devices.
-   **Animations:** Smooth animations for tile movement, spawning, and merging for a delightful experience.
-   **Score Keeping:** Tracks your current score and saves your best score to the browser's local storage.
-   **Farcaster Ready:** Built to be embedded as a Farcaster Frame.

## 🚀 How to Use on Farcaster

To deploy and use this mini-app on Farcaster, follow these steps:

### 1. Host the Application

Upload all the files (`index.html`, `index.tsx`, `metadata.json`) to a static hosting service. Popular free options include:
-   [Vercel](https://vercel.com/)
-   [Netlify](https://www.netlify.com/)
-   [GitHub Pages](https://pages.github.com/)

### 2. Update the URL

After successfully hosting, you will get a public URL. Open the `index.html` file and replace the `YOUR_DEPLOYED_APP_URL` string with the URL you received.

```html
<!-- ... -->
<!-- The iframe URL should point to your deployed application -->
<meta property="fc:frame:iframe_url" content="YOUR_DEPLOYED_APP_URL" />
<!-- ... -->
```

### 3. Share on Farcaster

Paste your hosted URL (e.g., `https://v2-frame-teeboo.vercel.app/`) into a cast on Warpcast or another Farcaster client. Farcaster will automatically detect the meta tags and display your game as a playable frame.

## 💻 Local Development

You don't need any complex build tools to run this project.

1.  Make sure you have the `index.html` and `index.tsx` files in the same directory.
2.  Run a local web server from that directory. A simple way is to use `npx`:

    ```bash
    # Run this command in the terminal at the project's directory
    npx serve
    ```

3.  Open your browser and navigate to the provided address (usually `http://localhost:3000`).

## 🛠️ Tech Stack

-   **React 19:** For building the user interface.
-   **TypeScript:** To ensure type-safe and maintainable code.
-   **HTML5 & CSS3:** For structure and styling, with CSS variables for theming.
-   **ESM Modules (via esm.sh):** Allows using React/TypeScript directly in the browser without a build step.
