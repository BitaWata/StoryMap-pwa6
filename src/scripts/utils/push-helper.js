import CONFIG from "../config.js";

const PushHelper = {
  async registerPush(registration) {
    try {

      const vapidPublicKey = "BFJy9QzAzEoI5VLtLnO52B1y05mJLL-cqIIb2FxoXYhEuJ-O0zpaCsXKYbmesCjbsl_A9Zfu7U4FhqBbsHqWI2I";
      const convertedKey = this._urlBase64ToUint8Array(vapidPublicKey);

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Izin notifikasi ditolak!");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      console.log("Push Subscription dibuat:", JSON.stringify(subscription));

      const token = localStorage.getItem("token");
      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth,
          },
        }),
      });

      const result = await response.json();
      console.log("Response dari server:", result);

      localStorage.setItem("pushSubscribed", "true");
      alert("✅ Push Notification berhasil diaktifkan!");
    } catch (err) {
      console.error("❌ Gagal membuat Push Subscription:", err);
      alert("Push Notification gagal diaktifkan. Coba lagi.");
    }
  },

  async unregisterPush(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const token = localStorage.getItem("token");
      const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      const result = await response.json();
      console.log("Unsubscribe result:", result);

      await subscription.unsubscribe();
      localStorage.removeItem("pushSubscribed");

      alert("🔕 Push Notification berhasil dimatikan!");
    } catch (err) {
      console.error("Gagal unsubscribe push:", err);
    }
  },

  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i)
      outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  },
};

export default PushHelper;