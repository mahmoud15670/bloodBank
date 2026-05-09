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
    icon: "/logo.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
