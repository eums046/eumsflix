import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getWatchlist, removeFromWatchlist, WatchlistItem } from "../services/watchlist";
import { Bookmark, Play, Trash2 } from "lucide-react";

// Module-level cache so revisiting is instant
let myListCache: WatchlistItem[] | null = null;

export function MyList() {
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<WatchlistItem[]>(myListCache ?? []);
  const [loading, setLoading] = useState(!myListCache);

  useEffect(() => {
    if (authLoading) return; // wait for auth to initialize
    if (!user) { setLoading(false); return; }
    getWatchlist(user.uid)
      .then((data) => { setList(data); myListCache = data; })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleRemove = async (item: WatchlistItem) => {
    if (!user) return;
    await removeFromWatchlist(user.uid, item.media_type, item.id);
    setList((prev) => prev.filter((i) => i.id !== item.id || i.media_type !== item.media_type));
  };

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-semibold mb-4">Sign in to see your list</h2>
          <Link to="/login" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-7 h-7 text-red-500" />
          <h1 className="text-3xl font-bold text-white">My List</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Your list is empty. Add movies and shows to watch later!</p>
            <Link to="/" className="inline-block mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {list.map((item) => (
              <div key={`${item.media_type}_${item.id}`} className="group relative">
                <Link to={`/${item.media_type}/${item.id}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900">
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="white" />
                    </div>
                  </div>
                  <h3 className="text-white text-sm mt-2 truncate">{item.title}</h3>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(item); }}
                  className="absolute top-2 right-2 z-10 bg-black/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
