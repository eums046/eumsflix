import { useParams, useNavigate } from "react-router";
import { Play, Plus, ThumbsUp, ChevronLeft } from "lucide-react";
import { VidkingPlayer } from "../components/VidkingPlayer";
import { MovieCard } from "../components/MovieCard";
import { getMovieDetails, getSimilarMovies } from "../services/tmdb";
import { useState, useEffect } from "react";
import { Movie } from "../types";

export function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPlayer, setShowPlayer] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchMovie = async () => {
      if (!id) return;
      setLoading(true);
      setShowPlayer(false);
      try {
        const [movieData, similarData] = await Promise.all([
          getMovieDetails(Number(id)),
          getSimilarMovies(Number(id))
        ]);
        if (mounted) {
          setMovie(movieData);
          setSimilarMovies(similarData);
        }
      } catch (e) {
        console.error("Failed to load movie details", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMovie();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} - eumsflix`;
    }
    return () => {
      document.title = "eumsflix";
    };
  }, [movie]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Video Player or Hero */}
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 z-50 flex items-center gap-2 bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {showPlayer ? (
          <VidkingPlayer
            tmdbId={movie.tmdbId}
            title={movie.title}
            type="movie"
          />
        ) : (
          <div className="relative h-[90vh]">
            <div className="absolute inset-0">
              <img
                src={movie.backdrop}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
            </div>

            <div className="relative container mx-auto px-4 h-full flex items-end pb-20">
              <div className="max-w-2xl">
                <h1 className="text-7xl font-black text-white mb-4 line-clamp-2">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-3 mb-6 text-sm text-gray-300">
                  <span className="text-green-500 font-semibold text-lg">
                    {Math.floor(Math.random() * 20) + 80}% Match
                  </span>
                  <span>{movie.year}</span>
                  <span className="border border-gray-400 px-2 py-0.5">
                    {movie.rating}
                  </span>
                  <span>{movie.duration}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genre.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-gray-800/80 text-gray-300 rounded text-sm backdrop-blur-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-6 h-6" fill="currentColor" />
                    Play
                  </button>
                  <button className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 text-gray-400 hover:border-white hover:text-white transition-colors">
                    <Plus className="w-6 h-6" />
                  </button>
                  <button className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-gray-400 text-gray-400 hover:border-white hover:text-white transition-colors">
                    <ThumbsUp className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-4">Synopsis</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {movie.description}
            </p>
          </div>
          <div>
            <div className="mb-6">
              <h3 className="text-gray-400 text-sm mb-2">Cast</h3>
              <p className="text-white">{movie.cast.length > 0 ? movie.cast.join(", ") : "Unknown"}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-gray-400 text-sm mb-2">Director</h3>
              <p className="text-white">{movie.director || "Unknown"}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-gray-400 text-sm mb-2">Genres</h3>
              <p className="text-white">{movie.genre.length > 0 ? movie.genre.join(", ") : "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-white mb-6">
              More Like This
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarMovies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
