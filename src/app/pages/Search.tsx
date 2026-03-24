import { useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Movie } from "../types";
import { searchMoviesAndSeries } from "../services/tmdb";
import { MovieCard } from "../components/MovieCard";

export function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      if (!q) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchMoviesAndSeries(q);
        if (mounted) setResults(data);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchResults();
    return () => { mounted = false; };
  }, [q]);

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="container mx-auto px-4">
        {q ? (
          <h1 className="text-3xl text-gray-400 mb-8">
            Search results for "<span className="text-white font-medium">{q}</span>"
          </h1>
        ) : (
          <h1 className="text-3xl text-gray-400 mb-8">
            Start typing to search
          </h1>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {results.map((movie) => (
              <div key={movie.id} className="w-48">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : q ? (
          <div className="text-center py-20 text-gray-400 text-xl">
            No results found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
