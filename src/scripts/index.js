import "../styles/styles.css";
import App from "./pages/app";
import IdbHelper from './data/idb.js';
import { postStory, getData } from './data/api.js'; 
import syncPendingStories from "./sync-handler.js";
import PushHelper from './utils/push-helper.js'; 

window.addEventListener('online', async () => {
  console.log('KONEKSI: online — melakukan sinkronisasi pending...');
  await syncPendingStories();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("✅ Service Worker registered:", registration.scope);

      await PushHelper.registerPush(registration);
      console.log("[PushHelper] Inisialisasi Push Notification selesai");
    } catch (err) {
      console.error("❌ SW registration failed:", err);
    }
  });
}

async function checkNewData() {
  try {
    const oldData = JSON.parse(localStorage.getItem("dataStory") || "[]");
    const newData = await getData();

    localStorage.setItem("dataStory", JSON.stringify(newData));

    if (oldData.length < newData.length) {
      const reg = await navigator.serviceWorker.ready;
      reg.active.postMessage({
        type: "NEW_DATA",
        title: "Notifikasi Baru",
        body: "Ada data baru ditambahkan."
      });
    }
  } catch (err) {
    console.error("❌ Gagal cek data baru:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const token = localStorage.getItem("token");

  if (!isLoggedIn || !token) {
    window.location.hash = "#/login";
  }

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage(app);

  await checkNewData();          
  setInterval(checkNewData, 30000); 

  window.addEventListener('hashchange', async () => {
    if (!document.startViewTransition) {
      await app.renderPage(); 
      return;
    }

    document.startViewTransition(async () => {
      await app.renderPage();
    });
  });

  window.addEventListener('online', async () => {
    console.log('🌐 Koneksi kembali online, mulai sinkronisasi data offline...');

    const pendingStories = await IdbHelper.getAllPendingStories();

    for (const story of pendingStories) {
      const photoFile = new File([story.image], "photo.jpg", { type: story.image.type || "image/jpeg" });

      const result = await postStory(story.description, photoFile, story.lat, story.lon);

      if (!result.error) {
        console.log("✅ Cerita tersinkron:", story.description);
      } else {
        console.error("❌ Gagal sinkron:", result.message);
      }
    }
    await IdbHelper.clearPendingStories();
  });

  const skipLink = document.querySelector(".skip-link");
  if (skipLink) {
    skipLink.addEventListener("click", (event) => {
      const storyList = document.querySelector("#story-list");
      if (storyList) {
        event.preventDefault();
        storyList.scrollIntoView({ behavior: "smooth" });
        storyList.focus();
      }
    });
  }
});