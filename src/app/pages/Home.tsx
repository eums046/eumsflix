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

export function Home() {
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [mostWatched, setMostWatched] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [topSeries, setTopSeries] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [f, n, m, tom, tos] = await Promise.all([
          getFeaturedMovie(),
          getNewReleases(),
          getMostWatchedMovies(),
          getTop10MoviesToday(),
          getTop10SeriesToday()
        ]);
        if (mounted) {
          setFeatured(f);
          setNewReleases(n);
          setMostWatched(m);
          setTopMovies(tom);
          setTopSeries(tos);
        }
      } catch (e) {
        console.error("Failed to fetch home movies:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

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
        <MovieRow title="Top 10 Movies Today" movies={topMovies} isTop10={true} />
        <MovieRow title="Top 10 Series Today" movies={topSeries} isTop10={true} />
        <MovieRow title="Most Watched Movies" movies={mostWatched} />
        <MovieRow title="New Releases" movies={newReleases} />
      </div>
    </div>
  );
}