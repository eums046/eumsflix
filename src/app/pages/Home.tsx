import { Play, Info } from "lucide-react";
import { Link } from "react-router";
import { MovieRow } from "../components/MovieRow";
import {
  getFeaturedMovie,
  getTrendingMovies,
  getNewReleases,
  getPopularMovies,
  getMostWatchedMovies
} from "../services/tmdb";
import { Movie } from "../types";
import { useState, useEffect } from "react";

export function Home() {
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [mostWatched, setMostWatched] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [f, t, n, p, m] = await Promise.all([
          getFeaturedMovie(),
          getTrendingMovies(),
          getNewReleases(),
          getPopularMovies(),
          getMostWatchedMovies()
        ]);
        if (mounted) {
          setFeatured(f);
          setTrending(t);
          setNewReleases(n);
          setPopular(p);
          setMostWatched(m);
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
                to={`/movie/${featured.id}`}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-colors"
              >
                <Play className="w-6 h-6" fill="currentColor" />
                Play
              </Link>
              <Link
                to={`/movie/${featured.id}`}
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
        <MovieRow title="Trending Now" movies={trending} />
        <MovieRow title="Most Watched Movies" movies={mostWatched} />
        <MovieRow title="New Releases" movies={newReleases} />
        <MovieRow title="Popular on EumsFlix" movies={popular} />
        <MovieRow title="Action & Adventure" movies={trending} />
      </div>
    </div>
  );
}