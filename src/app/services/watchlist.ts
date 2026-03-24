import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export interface WatchlistItem {
  id: number;
  title: string;
  poster: string;
  backdrop: string;
  media_type: "movie" | "tv";
  addedAt: any;
}

const getListRef = (userId: string) =>
  collection(db, "users", userId, "watchlist");

export const addToWatchlist = async (
  userId: string,
  item: Omit<WatchlistItem, "addedAt">
) => {
  const docId = `${item.media_type}_${item.id}`;
  await setDoc(doc(getListRef(userId), docId), {
    ...item,
    addedAt: serverTimestamp(),
  });
};

export const removeFromWatchlist = async (
  userId: string,
  mediaType: string,
  mediaId: number
) => {
  const docId = `${mediaType}_${mediaId}`;
  await deleteDoc(doc(getListRef(userId), docId));
};

export const isInWatchlist = async (
  userId: string,
  mediaType: string,
  mediaId: number
): Promise<boolean> => {
  const docId = `${mediaType}_${mediaId}`;
  const snap = await getDoc(doc(getListRef(userId), docId));
  return snap.exists();
};

export const getWatchlist = async (
  userId: string
): Promise<WatchlistItem[]> => {
  const q = query(getListRef(userId), orderBy("addedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as WatchlistItem);
};
