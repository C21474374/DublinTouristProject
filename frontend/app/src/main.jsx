/**
 * Application Entry Point
 * 
 * This file:
 * 1. Renders React app to DOM
 * 2. Sets up routing with React Router
 * 3. Registers service worker for PWA functionality
 * 4. Handles online/offline detection
 * 5. Manages PWA install prompts
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.scss";

// Mount React app to #root element in index.html
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ===== PWA SERVICE WORKER REGISTRATION =====
/**
 * Register service worker for PWA functionality
 * Service worker enables:
 * - Offline functionality (cached resources)
 * - Background sync
 * - Push notifications
 * - App installation
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((registration) => {
        console.log("✅ Service Worker registered:", registration);

        // Check for app updates every 60 seconds
        // If new version available, triggers 'pwa-update' event
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for when new service worker version is found
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            // New version installed and waiting - prompt user to reload
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("🔄 App update available");
              // Dispatch custom event for app to show update notification
              window.dispatchEvent(
                new CustomEvent("pwa-update", { detail: { registration } })
              );
            }
          });
        });
      })
      .catch((error) => {
        console.error("❌ Service Worker registration failed:", error);
      });
  });

  // Listen for messages from service worker
  // Service worker can send messages to app
  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("📨 Message from SW:", event.data);
  });
}

// ===== INSTALL PROMPT =====
/**
 * Handle PWA install prompt
 * beforeinstallprompt: Browser is ready to show install dialog
 * Save event for later use when user clicks "Install" button
 */
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent browser from showing default install prompt
  e.preventDefault();
  console.log("📲 Install prompt available");
  // Store for later use in InstallPrompt component
  window.deferredPrompt = e;
});

/**
 * Handle when app is successfully installed
 * Fires after user completes installation
 * Clear install prompt since app is now installed
 */
window.addEventListener("appinstalled", () => {
  console.log("✅ App installed");
  window.deferredPrompt = null;
});

// ===== ONLINE/OFFLINE DETECTION =====
/**
 * Monitor network connectivity changes
 * App can adjust behavior based on online/offline status
 * Dispatch custom events that components can listen to
 */

window.addEventListener("online", () => {
  console.log("📡 App is online");
  // Dispatch event for app to handle reconnection
  window.dispatchEvent(new CustomEvent("pwa-online"));
});

window.addEventListener("offline", () => {
  console.log("📴 App is offline");
  // Dispatch event for app to show offline indicator
  window.dispatchEvent(new CustomEvent("pwa-offline"));
});
