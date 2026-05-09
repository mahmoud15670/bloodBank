// إعدادات الـ Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCYXq7UrDRxWKR7eFx7x4wmfFdgesIU3xE",
  authDomain: "cbcapp-mgh.firebaseapp.com",
  databaseURL: "https://cbcapp-mgh-default-rtdb.firebaseio.com",
  projectId: "cbcapp-mgh",
  storageBucket: "cbcapp-mgh.firebasestorage.app",
  messagingSenderId: "946848538092",
  appId: "1:946848538092:web:99816678b3dd9eb4e174c9",
  measurementId: "G-4JHNK5R8D1",
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const messaging = firebase.messaging();

const keys = [
  "rbc_ap",
  "rbc_am",
  "rbc_bp",
  "rbc_bm",
  "rbc_abp",
  "rbc_abm",
  "rbc_op",
  "rbc_om",
  "plasma_ap",
  "plasma_bp",
  "plasma_abp",
  "plasma_op",
  "plat_ap",
  "plat_am",
  "plat_bp",
  "plat_bm",
  "plat_abp",
  "plat_abm",
  "plat_op",
  "plat_om",
  "part_ap",
  "part_am",
  "part_bp",
  "part_bm",
  "part_abp",
  "part_abm",
  "part_op",
  "part_om",
];

window.onload = function () {
  registerServiceWorker();
  requestNotificationPermission();

  // تحميل القيم المحفوظة محلياً
  keys.forEach((key) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      document.getElementById(key).value = savedValue;
    }
  });

  // الاستماع لتغييرات قاعدة البيانات
  db.ref("blood_bank").on(
    "value",
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        keys.forEach((key) => {
          if (data[key] !== undefined) {
            document.getElementById(key).value = data[key];
            localStorage.setItem(key, data[key]);
          }
        });
      }
    },
    (error) => {
      console.error("تعذر جلب البيانات من Firebase:", error);
    },
  );

  // إضافة event listeners للـinputs
  keys.forEach((key) => {
    const input = document.getElementById(key);
    input.addEventListener("click", function () {
      this.dataset.oldValue = this.value;
      this.value = "";
    });
    input.addEventListener("blur", function () {
      if (this.value === "") {
        this.value = this.dataset.oldValue || "";
      }
    });
  });

  startClock();
  checkAlarm();
  setInterval(checkAlarm, 60000); // فحص الوقت كل دقيقة
};

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("فشل تسجيل Service Worker:", error);
      });
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("تم تفعيل إشعارات PWA");
        getMessagingToken();
      }
    });
  } else if (Notification.permission === "granted") {
    getMessagingToken();
  }
}

function getMessagingToken() {
  messaging
    .getToken({
      vapidKey:
        "BISD0AJZ2hpGO0wEcwELurAgkF4tVanyDsvgQD7o2Y0FyB37j3WJeyM4zlP5aM_DujCQRG_r5BVEw8S6kwq9IcE",
    })
    .then((currentToken) => {
      if (currentToken) {
        console.log("Registration token available:", currentToken);
        // حفظ التوكن في Firebase للإرسال لاحقاً
        db.ref("notification_tokens").push({
          token: currentToken,
          timestamp: Date.now(),
        });
      } else {
        console.log("No registration token available.");
      }
    })
    .catch((err) => {
      console.log("An error occurred while retrieving token. ", err);
    });
}

function showAppNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body,
    icon: "/logo.svg",
    badge: "/logo.svg",
  };

  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options).catch((error) => {
        console.error("خطأ في عرض الإشعار:", error);
      });
    });
  } else {
    new Notification(title, options);
  }
}

function startClock() {
  function updateClock() {
    const now = new Date();
    document.getElementById("live-clock").innerText =
      "الوقت الحالي: " + now.toLocaleTimeString("ar-EG");
  }
  updateClock();
  setInterval(updateClock, 1000);
}

function checkAlarm() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if ((h === 7 || h === 19) && m === 0) {
    const title = "⏰ تحديث رصيد بنك الدم";
    const body = `تم تحديث الرصيد الآن عند ${now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    showAppNotification(title, body);
    showSimplifiedView();
  }
}

function saveData() {
  const updates = {};
  keys.forEach((key) => {
    const inputValue = document.getElementById(key).value;
    updates[key] = parseInt(inputValue) || 0;
    localStorage.setItem(key, inputValue);
  });

  db.ref("blood_bank")
    .update(updates)
    .then(() => {
      const notification = document.getElementById("notification");
      notification.style.display = "block";
      setTimeout(() => {
        notification.style.display = "none";
      }, 3000);
    })
    .catch((error) => {
      alert("حدث خطأ أثناء حفظ البيانات: " + error.message);
    });
}

function showSimplifiedView() {
  const mainContainer = document.getElementById("main-container");
  const resultContainer = document.getElementById("result-container");
  const tableBody = document.getElementById("simplified-table-body");

  tableBody.innerHTML = "";
  let hasData = false;

  const alwaysShowKeys = [
    "rbc_ap",
    "rbc_bp",
    "rbc_abp",
    "rbc_op",
    "plasma_ap",
    "plasma_bp",
    "plasma_abp",
    "plasma_op",
  ];

  keys.forEach((key) => {
    const value = parseInt(document.getElementById(key).value) || 0;
    let shouldShow = false;

    if (alwaysShowKeys.includes(key)) {
      shouldShow = true;
    } else if (value > 0) {
      shouldShow = true;
    }

    if (shouldShow) {
      hasData = true;
      const componentName = getComponentName(key);
      let typeName = getTypeName(key);

      if (key.includes("plasma")) {
        typeName = typeName.replace("+", "");
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><b>${componentName}</b></td>
        <td>${typeName}</td>
        <td><b>${value}</b></td>
      `;
      tableBody.appendChild(row);
    }
  });

  if (!hasData) {
    alert("لا توجد فصائل بقيمة أكبر من صفر لالتقاطها!");
    return;
  }

  mainContainer.classList.add("hidden");
  resultContainer.classList.remove("hidden");
}

function goBack() {
  document.getElementById("main-container").classList.remove("hidden");
  document.getElementById("result-container").classList.add("hidden");
}

function captureImage() {
  const captureArea = document.getElementById("capture-area");
  html2canvas(captureArea, { scale: 2 }).then((canvas) => {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "blood-components.png";
    link.href = image;
    link.click();
  });
}

function shareViaWhatsApp() {
  const captureArea = document.getElementById("capture-area");

  html2canvas(captureArea, { scale: 2 }).then((canvas) => {
    canvas.toBlob(function (blob) {
      const file = new File([blob], "blood-components.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator
          .share({
            files: [file],
            title: "تقرير مكونات الدم",
            text: "مرحباً، إليكم رصيد بنك الدم المتاح حالياً.",
          })
          .catch((error) => console.log("خطأ في المشاركة", error));
      } else {
        captureImage();
        alert(
          "المتصفح لا يدعم المشاركة المباشرة، تم تنزيل الصورة تلقائياً لتقوم بإرسالها يدوياً.",
        );
      }
    });
  });
}

function getComponentName(key) {
  if (key.startsWith("rbc_")) return "كرات الدم (RBCs)";
  if (key.startsWith("plasma_")) return "البلازما (Plasma)";
  if (key.startsWith("plat_")) return "الصفائح (Platelets)";
  if (key.startsWith("part_")) return "الأجزاء (Parts)";
  return "";
}

function getTypeName(key) {
  const suffix = key.split("_")[1];
  const map = {
    ap: "+A",
    am: "-A",
    bp: "+B",
    bm: "-B",
    abp: "+AB",
    abm: "-AB",
    op: "+O",
    om: "-O",
  };
  return map[suffix] || suffix;
}
window.onload = function () {
  registerServiceWorker();
  requestNotificationPermission();

  keys.forEach((key) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      document.getElementById(key).value = savedValue;
    }
  });

  db.ref("blood_bank").on(
    "value",
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        keys.forEach((key) => {
          if (data[key] !== undefined) {
            document.getElementById(key).value = data[key];
            localStorage.setItem(key, data[key]); // حفظ القراءة الحديثة محلياً أيضاً
          }
        });
      }
    },
    (error) => {
      console.error("تعذر جلب البيانات من Firebase:", error);
    },
  );

  keys.forEach((key) => {
    const input = document.getElementById(key);

    input.addEventListener("click", function () {
      this.dataset.oldValue = this.value;
      this.value = "";
    });

    input.addEventListener("blur", function () {
      if (this.value === "") {
        this.value = this.dataset.oldValue || "";
      }
    });
  });

  startClock();
  checkAlarm();
  setInterval(checkAlarm, 60000); // فحص الوقت كل دقيقة
};

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("فشل تسجيل Service Worker:", error);
      });
  }
}

function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("تم تفعيل إشعارات PWA");
        getMessagingToken();
      }
    });
  } else if (Notification.permission === "granted") {
    getMessagingToken();
  }
}

function getMessagingToken() {
  messaging
    .getToken({
      vapidKey:
        "BISD0AJZ2hpGO0wEcwELurAgkF4tVanyDsvgQD7o2Y0FyB37j3WJeyM4zlP5aM_DujCQRG_r5BVEw8S6kwq9IcE",
    })
    .then((currentToken) => {
      // Get new FCM registration token
      if (currentToken) {
        console.log("Registration token available:", currentToken);

        // حفظ التوكن في Firebase للإرسال لاحقاً
        db.ref("notification_tokens").push({
          token: currentToken,
          timestamp: Date.now(),
        });
      } else {
        console.log("No registration token available.");
      }
    })
    .catch((err) => {
      console.log("An error occurred while retrieving token. ", err);
    });
}

function showAppNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const options = {
    body,
    icon: "/logo.svg",
    badge: "/logo.svg",
  };

  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options).catch((error) => {
        console.error("خطأ في عرض الإشعار:", error);
      });
    });
  } else {
    new Notification(title, options);
  }
}

function startClock() {
  function updateClock() {
    const now = new Date();
    document.getElementById("live-clock").innerText =
      "الوقت الحالي: " + now.toLocaleTimeString("ar-EG");
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// فحص وقت التنبيه (الساعة 7:00 صباحاً و 7:00 مساءً)
function checkAlarm() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if ((h === 7 || h === 19) && m === 0) {
    const title = "⏰ تحديث رصيد بنك الدم";
    const body = `تم تحديث الرصيد الآن عند ${now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    showAppNotification(title, body);
    showSimplifiedView();
  }
}

// 2. حفظ البيانات في الـ Firebase والـ LocalStorage
function saveData() {
  const updates = {};
  keys.forEach((key) => {
    const inputValue = document.getElementById(key).value;
    updates[key] = parseInt(inputValue) || 0;
    localStorage.setItem(key, inputValue);
  });

  // إرسال البيانات إلى Firebase
  db.ref("blood_bank")
    .update(updates)
    .then(() => {
      const notification = document.getElementById("notification");
      notification.style.display = "block";
      setTimeout(() => {
        notification.style.display = "none";
      }, 3000);
    })
    .catch((error) => {
      alert("حدث خطأ أثناء حفظ البيانات: " + error.message);
    });
}

// 3. الانتقال لشاشة الجدول المبسط
function showSimplifiedView() {
  const mainContainer = document.getElementById("main-container");
  const resultContainer = document.getElementById("result-container");
  const tableBody = document.getElementById("simplified-table-body");

  tableBody.innerHTML = "";
  let hasData = false;

  const alwaysShowKeys = [
    "rbc_ap",
    "rbc_bp",
    "rbc_abp",
    "rbc_op",
    "plasma_ap",
    "plasma_bp",
    "plasma_abp",
    "plasma_op",
  ];

  keys.forEach((key) => {
    const value = parseInt(document.getElementById(key).value) || 0;
    let shouldShow = false;

    if (alwaysShowKeys.includes(key)) {
      shouldShow = true;
    } else if (value > 0) {
      shouldShow = true;
    }

    if (shouldShow) {
      hasData = true;
      const componentName = getComponentName(key);
      let typeName = getTypeName(key);

      if (key.includes("plasma")) {
        typeName = typeName.replace("+", "");
      }

      const row = document.createElement("tr");
      row.innerHTML = `
              <td><b>${componentName}</b></td>
              <td>${typeName}</td>
              <td><b>${value}</b></td>
            `;
      tableBody.appendChild(row);
    }
  });

  if (!hasData) {
    alert("لا توجد فصائل بقيمة أكبر من صفر لالتقاطها!");
    return;
  }

  mainContainer.classList.add("hidden");
  resultContainer.classList.remove("hidden");
}

// 4. العودة للجدول الرئيسي
function goBack() {
  document.getElementById("main-container").classList.remove("hidden");
  document.getElementById("result-container").classList.add("hidden");
}

// 5. حفظ الصورة (تحميل)
function captureImage() {
  const captureArea = document.getElementById("capture-area");
  html2canvas(captureArea, { scale: 2 }).then((canvas) => {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "blood-components.png";
    link.href = image;
    link.click();
  });
}

// 6. المشاركة التلقائية في الواتساب
function shareViaWhatsApp() {
  const captureArea = document.getElementById("capture-area");

  html2canvas(captureArea, { scale: 2 }).then((canvas) => {
    canvas.toBlob(function (blob) {
      const file = new File([blob], "blood-components.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator
          .share({
            files: [file],
            title: "تقرير مكونات الدم",
            text: "مرحباً، إليكم رصيد بنك الدم المتاح حالياً.",
          })
          .catch((error) => console.log("خطأ في المشاركة", error));
      } else {
        captureImage();
        alert(
          "المتصفح لا يدعم المشاركة المباشرة، تم تنزيل الصورة تلقائياً لتقوم بإرسالها يدوياً.",
        );
      }
    });
  });
}

function getComponentName(key) {
  if (key.startsWith("rbc_")) return "كرات الدم (RBCs)";
  if (key.startsWith("plasma_")) return "البلازما (Plasma)";
  if (key.startsWith("plat_")) return "الصفائح (Platelets)";
  if (key.startsWith("part_")) return "الأجزاء (Parts)";
  return "";
}

function getTypeName(key) {
  const suffix = key.split("_")[1];
  const map = {
    ap: "+A",
    am: "-A",
    bp: "+B",
    bm: "-B",
    abp: "+AB",
    abm: "-AB",
    op: "+O",
    om: "-O",
  };
  return map[suffix] || suffix;
}
