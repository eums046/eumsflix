import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getWatchHistory, WatchHistoryItem } from "../services/watchHistory";
import { Clock, Play } from "lucide-react";

export function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const items = await getWatchHistory(user.uid, 50);
        setHistory(items);
      } catch (e) {
        console.error("Failed to fetch watch history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl font-semibold mb-4">Sign in to see your history</h2>
          <Link
            to="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
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
          <Clock className="w-7 h-7 text-red-500" />
          <h1 className="text-3xl font-bold text-white">Watch History</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">You haven't watched anything yet.</p>
            <Link
              to="/"
              className="inline-block mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                to={`/${item.media_type}/${item.id}`}
                className="group relative"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="white" />
                  </div>
                  {item.season && item.episode && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      S{item.season} E{item.episode}
                    </div>
                  )}
                </div>
                <h3 className="text-white text-sm mt-2 truncate">{item.title}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
