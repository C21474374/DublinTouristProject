import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ===== PWA SERVICE WORKER REGISTRATION =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .then((registration) => {
        console.log("✅ Service Worker registered:", registration);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("🔄 App update available");
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

  // Handle messages from service worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("📨 Message from SW:", event.data);
  });
}

// ===== INSTALL PROMPT =====
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  console.log("📲 Install prompt available");
  window.deferredPrompt = e;
});

window.addEventListener("appinstalled", () => {
  console.log("✅ App installed");
  window.deferredPrompt = null;
});

// ===== ONLINE/OFFLINE DETECTION =====
window.addEventListener("online", () => {
  console.log("📡 App is online");
  window.dispatchEvent(new CustomEvent("pwa-online"));
});

window.addEventListener("offline", () => {
  console.log("📴 App is offline");
  window.dispatchEvent(new CustomEvent("pwa-offline"));
});
