import { useState, useEffect } from "react";
import { MovieCard } from "../components/MovieCard";
import { getGenres, getMoviesByGenreId, getPopularMovies } from "../services/tmdb";
import { Movie } from "../types";

export function Browse() {
  const [selectedGenre, setSelectedGenre] = useState<{id: number | null, name: string}>({ id: null, name: "All" });
  const [genres, setGenres] = useState<{id: number, name: string}[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchGenres = async () => {
      try {
        const gList = await getGenres();
        if (mounted) setGenres(gList);
      } catch (e) {}
    };
    fetchGenres();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let mList;
        if (selectedGenre.id === null) {
            mList = await getPopularMovies(); // Fallback for "All"
        } else {
            mList = await getMoviesByGenreId(selectedGenre.id.toString());
        }
        if (mounted) setMovies(mList);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMovies();
    return () => { mounted = false; };
  }, [selectedGenre]);

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-black text-white mb-8">Browse Movies</h1>

        {/* Genre Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGenre({ id: null, name: "All" })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedGenre.id === null
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre.id === genre.id
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
