import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

export interface WatchHistoryItem {
  id: number;
  title: string;
  poster: string;
  backdrop: string;
  media_type: "movie" | "tv";
  season?: number;
  episode?: number;
  watchedAt: any;
}

const getHistoryRef = (userId: string) =>
  collection(db, "users", userId, "watchHistory");

export const addToWatchHistory = async (
  userId: string,
  item: Omit<WatchHistoryItem, "watchedAt">
) => {
  const docId = item.media_type === "tv" && item.season && item.episode
    ? `${item.media_type}_${item.id}_s${item.season}e${item.episode}`
    : `${item.media_type}_${item.id}`;

  await setDoc(doc(getHistoryRef(userId), docId), {
    ...item,
    watchedAt: serverTimestamp(),
  });
};

export const getWatchHistory = async (
  userId: string,
  maxItems = 20
): Promise<WatchHistoryItem[]> => {
  const q = query(getHistoryRef(userId), orderBy("watchedAt", "desc"), limit(maxItems));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as WatchHistoryItem);
};

export const getContinueWatching = async (
  userId: string
): Promise<WatchHistoryItem[]> => {
  return getWatchHistory(userId, 10);
};

export const removeFromWatchHistory = async (
  userId: string,
  docId: string
) => {
  await deleteDoc(doc(getHistoryRef(userId), docId));
};
