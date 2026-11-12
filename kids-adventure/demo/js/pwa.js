/* =========================================================================
   pwa.js — turns on Kido's offline service worker (sw.js) in the production
   web build (Change #19). It does nothing:
     • in development — only `npm run build` stamps <html data-build>, so a dev
       server never gets a worker caching files while they are being edited;
     • inside the native app — Capacitor already serves every file locally;
     • from file:// or plain http on a LAN address — no service workers there.
   ========================================================================= */
(function (window) {
  "use strict";
  var build = document.documentElement.getAttribute("data-build");
  var cap = window.Capacitor;
  var native = !!(cap && (typeof cap.isNativePlatform === "function" ? cap.isNativePlatform()
    : (cap.platform || (cap.getPlatform && cap.getPlatform()) || "web") !== "web"));
  if (!build || native || !("serviceWorker" in navigator) || !window.isSecureContext) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline support is optional */ });
  });
})(window);
