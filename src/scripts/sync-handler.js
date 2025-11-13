import IdbHelper from "./data/idb.js";
import { postData } from "./data/api.js";

async function syncPendingStories() {
  const pending = await IdbHelper.getAllPendingStories();
  if (!pending || pending.length === 0) return;

  console.log('[Sync] Menyinkronkan pending stories:', pending.length);
  for (const item of pending) {
    try {
      let photoFile = null;
      if (item.image) {
        photoFile = new File([item.image], `offline-${item.date || Date.now()}.jpg`, { type: item.image.type || 'image/jpeg' });
      }
      await postData(item.description, photoFile, item.lat, item.lon);
    } catch (err) {
      console.error('[Sync] Gagal mengirim salah satu pending story:', err);
    }
  }

  await IdbHelper.clearPendingStories();
  console.log('[Sync] Selesai sinkronisasi pending stories.');
}

export default syncPendingStories;