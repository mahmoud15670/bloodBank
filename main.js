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
];

// 1. استرجاع البيانات عند التحميل وتشغيل الساعة
window.onload = function () {
  keys.forEach((key) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      document.getElementById(key).value = savedValue;
    }
  });
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
  setInterval(checkAlarm, 60000); // فحص الوقت كل دقيقة
};

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
    alert("⏰ حان الوقت المحدد لإرسال تقرير مكونات الدم. تم تحضير البيانات!");
    showSimplifiedView();
  }
}

// 2. حفظ البيانات
function saveData() {
  keys.forEach((key) => {
    const inputValue = document.getElementById(key).value;
    localStorage.setItem(key, inputValue);
  });

  const notification = document.getElementById("notification");
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// 3. الانتقال لشاشة الجدول المبسط
function showSimplifiedView() {
  const mainContainer = document.getElementById("main-container");
  const resultContainer = document.getElementById("result-container");
  const tableBody = document.getElementById("simplified-table-body");

  tableBody.innerHTML = "";
  let hasData = false;

  keys.forEach((key) => {
    const value = parseInt(document.getElementById(key).value) || 0;
    if (value > 0) {
      hasData = true;
      const componentName = getComponentName(key);
      const typeName = getTypeName(key);

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
      // إنشاء ملف صورة
      const file = new File([blob], "blood-components.png", {
        type: "image/png",
      });

      // التحقق مما إذا كان المتصفح يدعم المشاركة الأصلية
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator
          .share({
            files: [file],
            title: "تقرير مكونات الدم",
            text: "رصيد بنك الدم - برج العرب",
          })
          .catch((error) => console.log("خطأ في المشاركة", error));
      } else {
        // إذا كان الجهاز لا يدعم (مثل بعض أجهزة الكمبيوتر)، سيتم تحميل الصورة بدلاً من ذلك
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
