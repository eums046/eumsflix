import { Play, Info } from "lucide-react";
import { Link } from "react-router";
import { MovieRow } from "../components/MovieRow";
import {
  getFeaturedMovie,
  getNewReleases,
  getMostWatchedMovies,
  getTop10MoviesToday,
  getTop10SeriesToday
} from "../services/tmdb";
import { Movie } from "../types";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getContinueWatching, WatchHistoryItem } from "../services/watchHistory";

export function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [mostWatched, setMostWatched] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [topSeries, setTopSeries] = useState<Movie[]>([]);
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [f, n, m, tom, tos, cw] = await Promise.all([
          getFeaturedMovie(),
          getNewReleases(),
          getMostWatchedMovies(),
          getTop10MoviesToday(),
          getTop10SeriesToday(),
          user ? getContinueWatching(user.uid) : Promise.resolve([])
        ]);
        if (mounted) {
          setFeatured(f);
          setNewReleases(n);
          setMostWatched(m);
          setTopMovies(tom);
          setTopSeries(tos);
          setContinueWatching(cw);
        }
      } catch (e) {
        console.error("Failed to fetch home movies:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [user]);

  if (loading || !featured) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[90vh]">
        <div className="absolute inset-0">
          <img
            src={featured.backdrop}
            alt={featured.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-black text-white mb-4 line-clamp-2">
              {featured.title}
            </h1>
            <div className="flex items-center gap-3 mb-4 text-sm text-gray-300">
              <span className="text-green-500 font-semibold">
                {Math.floor(Math.random() * 20) + 80}% Match
              </span>
              <span>{featured.year}</span>
              <span className="border border-gray-400 px-2 py-0.5">
                {featured.rating}
              </span>
              <span>{featured.duration}</span>
            </div>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed line-clamp-3">
              {featured.description}
            </p>
            <div className="flex items-center gap-4">
              <Link
                to={`/${featured.media_type || 'movie'}/${featured.id}`}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                Play
              </Link>
              <Link
                to={`/${featured.media_type || 'movie'}/${featured.id}`}
                className="flex items-center gap-2 bg-gray-500/50 text-white px-8 py-3 rounded font-semibold text-lg hover:bg-gray-500/70 transition-colors backdrop-blur-sm"
              >
                <Info className="w-6 h-6" />
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Rows */}
      <div className="relative -mt-32 pb-20">
        {continueWatching.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 px-4">Continue Watching</h2>
            <div className="flex gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
              {continueWatching.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  to={`/${item.media_type}/${item.id}`}
                  className="flex-shrink-0 w-64 group relative"
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
                    <img
                      src={item.backdrop || item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                      <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                    </div>
                    {item.season && item.episode && (
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        S{item.season} E{item.episode}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm mt-2 truncate">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
        <MovieRow title="Top 10 Movies Today" movies={topMovies} isTop10={true} />
        <MovieRow title="Top 10 Series Today" movies={topSeries} isTop10={true} />
        <MovieRow title="Most Watched Movies" movies={mostWatched} />
        <MovieRow title="New Releases" movies={newReleases} />
      </div>
    </div>
  );
}