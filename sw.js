importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCYXq7UrDRxWKR7eFx7x4wmfFdgesIU3xE",
  authDomain: "cbcapp-mgh.firebaseapp.com",
  databaseURL: "https://cbcapp-mgh-default-rtdb.firebaseio.com",
  projectId: "cbcapp-mgh",
  storageBucket: "cbcapp-mgh.firebasestorage.app",
  messagingSenderId: "946848538092",
  appId: "1:946848538092:web:99816678b3dd9eb4e174c9",
  measurementId: "G-4JHNK5R8D1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const CACHE_NAME = "blood-bank-cache-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/main.js",
  "/manifest.webmanifest",
  "/icon.svg",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js",
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        }),
      ),
    ),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    }),
  );
});
