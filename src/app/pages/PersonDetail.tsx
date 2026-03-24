import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, User } from "lucide-react";
import { getPersonDetails, getPersonCredits, PersonDetails } from "../services/tmdb";
import { Movie } from "../types";
import { MovieCard } from "../components/MovieCard";

export function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [p, c] = await Promise.all([
          getPersonDetails(Number(id)),
          getPersonCredits(Number(id))
        ]);
        if (mounted) {
          setPerson(p);
          setCredits(c);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (person) document.title = `${person.name} - eumsflix`;
    return () => { document.title = "eumsflix"; };
  }, [person]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Person not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-16">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {/* Person Info */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {person.profile_path ? (
            <img
              src={person.profile_path}
              alt={person.name}
              className="w-48 h-72 object-cover rounded-xl flex-shrink-0"
            />
          ) : (
            <div className="w-48 h-72 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-20 h-20 text-gray-600" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">{person.name}</h1>
            <p className="text-red-500 font-medium mb-4">{person.known_for_department}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
              {person.birthday && (
                <span>Born: {new Date(person.birthday).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              )}
              {person.place_of_birth && (
                <span>📍 {person.place_of_birth}</span>
              )}
            </div>

            {person.biography && (
              <div>
                <p className={`text-gray-300 leading-relaxed ${bioExpanded ? "" : "line-clamp-5"}`}>
                  {person.biography}
                </p>
                {person.biography.length > 400 && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="text-red-500 hover:text-red-400 text-sm mt-2 font-medium transition-colors"
                  >
                    {bioExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filmography */}
        {credits.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">
              Filmography <span className="text-gray-500 text-lg font-normal">({credits.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {credits.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
