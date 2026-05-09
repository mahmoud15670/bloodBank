# بنك الدم - PWA مع إشعارات

تطبيق ويب تقدمي لإدارة رصيد بنك الدم مع إشعارات تلقائية.

## الميزات

- إدارة رصيد الدم (RBC, Plasma, Platelets, Parts)
- حفظ البيانات محلياً وفي Firebase
- مشاركة التقارير عبر WhatsApp
- إشعارات عند الساعة 7 صباحاً و7 مساءً
- دعم PWA (Progressive Web App)

## إعداد الإشعارات

لإرسال إشعارات مستقلة (حتى لو التطبيق مغلق):

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك `cbcapp-mgh`
3. اذهب إلى Project Settings > Cloud Messaging
4. في Web Push certificates، انقر "Generate Key Pair"
5. انسخ VAPID Key واستبدل المفتاح الحالي في `main.js` (موجود بالفعل)

### الحصول على FCM Token

التطبيق سيحفظ التوكن في Firebase path:

```
notification_tokens/
```

لرؤية التوكن في Debug Console:

```javascript
// أضفه في browser console
messaging
  .getToken({
    vapidKey:
      "BISD0AJZ2hpGO0wEcwELurAgkF4tVanyDsvgQD7o2Y0FyB37j3WJeyM4zlP5aM_DujCQRG_r5BVEw8S6kwq9IcE",
  })
  .then((token) => {
    console.log("Your FCM Token:", token);
  });
```

### إضافة أجهزة الاختبار

1. في Firebase Console > Cloud Messaging
2. تحت **Protocol** شغّل **Send test message**
3. في **Add device token** الصق التوكن
4. اضغط **Subscribe to all**

### إرسال إشعار تجريبي

1. في **Send test message**
2. أدخل العنوان والرسالة
3. اختر الجهاز المضاف
4. اضغط **Send test notification**

الإشعار سيصل حتى لو التطبيق مغلق ✅

## التشغيل

- افتح `index.html` في متصفح حديث
- انقر "تثبيت" لتثبيت كـPWA
- اقبل إذن الإشعارات

## التقنيات

- HTML/CSS/JavaScript
- Firebase (Realtime Database + Cloud Messaging)
- Service Worker
- PWA APIs
