import { useSearchParams, Link } from "react-router";
import { useEffect, useState } from "react";
import { Movie } from "../types";
import { searchMoviesAndSeries, searchPeople, PersonResult } from "../services/tmdb";
import { MovieCard } from "../components/MovieCard";
import { User } from "lucide-react";

export function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<Movie[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      if (!q) {
        setResults([]);
        setPeople([]);
        return;
      }
      setLoading(true);
      try {
        const [mediaData, peopleData] = await Promise.all([
          searchMoviesAndSeries(q),
          searchPeople(q)
        ]);
        if (mounted) {
          setResults(mediaData);
          setPeople(peopleData);
        }
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
        ) : (
          <>
            {/* People Results */}
            {people.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" />
                  People
                </h2>
                <div className="flex gap-6 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
                  {people.map((person) => (
                    <Link key={person.id} to={`/person/${person.id}`} className="flex-shrink-0 w-72">
                      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                          {person.profile_path ? (
                            <img
                              src={person.profile_path}
                              alt={person.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                              <User className="w-8 h-8 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-white font-semibold text-lg">{person.name}</h3>
                            <p className="text-gray-500 text-sm">{person.known_for_department}</p>
                          </div>
                        </div>
                        {person.known_for.length > 0 && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Known For</p>
                            <div className="flex gap-2">
                              {person.known_for.map((m) => (
                                <span
                                  key={m.id}
                                  className="flex-shrink-0 w-14"
                                  title={m.title}
                                >
                                  <img
                                    src={m.poster}
                                    alt={m.title}
                                    className="w-full aspect-[2/3] object-cover rounded"
                                  />
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Movies & Series Results */}
            {results.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Movies & Series</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              </div>
            )}

            {q && results.length === 0 && people.length === 0 && (
              <div className="text-center py-20 text-gray-400 text-xl">
                No results found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
