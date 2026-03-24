import { useParams, useNavigate } from "react-router";
import { Play, Plus, ThumbsUp, ChevronLeft, Check } from "lucide-react";
import { VidkingPlayer } from "../components/VidkingPlayer";
import { MovieCard } from "../components/MovieCard";
import { getMovieDetails, getSimilarMovies, getSeasonDetails, getMovieReviews } from "../services/tmdb";
import { useState, useEffect } from "react";
import { Movie, Episode, Review } from "../types";
import { useAuth } from "../context/AuthContext";
import { addToWatchHistory } from "../services/watchHistory";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "../services/watchlist";

export function MovieDetail() {
  const { id, type } = useParams();
  const mediaType = (type === "tv" ? "tv" : "movie") as "movie" | "tv";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPlayer, setShowPlayer] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  
  const [playingSeason, setPlayingSeason] = useState<number | null>(null);
  const [playingEpisode, setPlayingEpisode] = useState<number | null>(null);
  const [inList, setInList] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const computeHasNextEpisode = (s: number, e: number) => {
    if (!movie?.seasons) return false;
    const season = movie.seasons.find(sz => sz.season_number === s);
    if (!season) return false;
    if (e < season.episode_count) return true;
    const nextSeason = movie.seasons.find(sz => sz.season_number === s + 1);
    return !!(nextSeason && nextSeason.episode_count > 0);
  };

  const handleNextEpisode = (s: number, e: number) => {
    if (!movie?.seasons) return;
    const season = movie.seasons.find(sz => sz.season_number === s);
    if (!season) return;
    
    if (e < season.episode_count) {
      setPlayingEpisode(e + 1);
      setSelectedSeason(s);
    } else {
      const nextSeason = movie.seasons.find(sz => sz.season_number === s + 1);
      if (nextSeason && nextSeason.episode_count > 0) {
        setPlayingSeason(s + 1);
        setPlayingEpisode(1);
        setSelectedSeason(s + 1);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchMovie = async () => {
      if (!id) return;
      setLoading(true);
      setShowPlayer(false);
      try {
        const [movieData, similarData, reviewsData] = await Promise.all([
          getMovieDetails(Number(id), mediaType),
          getSimilarMovies(Number(id), mediaType),
          getMovieReviews(Number(id), mediaType)
        ]);
        if (mounted) {
          setMovie(movieData);
          setSimilarMovies(similarData);
          setReviews(reviewsData);
        }
      } catch (e) {
        console.error("Failed to load movie details", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMovie();
    return () => { mounted = false; };
  }, [id, mediaType]);

  useEffect(() => {
    if (user && id) {
      isInWatchlist(user.uid, mediaType, Number(id)).then(setInList).catch(console.error);
    }
  }, [user, id, mediaType]);

  useEffect(() => {
    if (movie) {
      document.title = `${movie.title} - eumsflix`;
    }
    return () => {
      document.title = "eumsflix";
    };
  }, [movie]);

  useEffect(() => {
    if (movie?.seasons && movie.seasons.length > 0) {
      setSelectedSeason(movie.seasons[0].season_number);
    }
  }, [movie]);

  useEffect(() => {
    if (movie?.tmdbId && selectedSeason !== null) {
      let mounted = true;
      setLoadingEpisodes(true);
      getSeasonDetails(movie.tmdbId, selectedSeason).then(eps => {
        if (mounted) {
          setEpisodes(eps);
          setLoadingEpisodes(false);
        }
      }).catch(e => {
        console.error(e);
        if (mounted) setLoadingEpisodes(false);
      });
      return () => { mounted = false; };
    }
  }, [movie?.tmdbId, selectedSeason]);

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
            type={mediaType}
            season={playingSeason ?? undefined}
            episode={playingEpisode ?? undefined}
            hasNextEpisode={!!playingSeason && !!playingEpisode && computeHasNextEpisode(playingSeason, playingEpisode)}
            onNextEpisode={() => handleNextEpisode(playingSeason!, playingEpisode!)}
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
                    onClick={() => {
                      if (mediaType === "tv" && movie.seasons && movie.seasons.length > 0) {
                        setPlayingSeason(movie.seasons[0].season_number);
                        setPlayingEpisode(1);
                        setSelectedSeason(movie.seasons[0].season_number);
                      }
                      setShowPlayer(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      if (user) {
                        addToWatchHistory(user.uid, {
                          id: movie.tmdbId,
                          title: movie.title,
                          poster: movie.poster,
                          backdrop: movie.backdrop,
                          media_type: mediaType,
                          season: mediaType === "tv" && movie.seasons?.[0] ? movie.seasons[0].season_number : undefined,
                          episode: mediaType === "tv" ? 1 : undefined,
                        }).catch(console.error);
                      }
                    }}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-6 h-6" fill="currentColor" />
                    Play
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      if (inList) {
                        await removeFromWatchlist(user.uid, mediaType, movie.tmdbId);
                        setInList(false);
                        setToast(`"${movie.title}" removed from My List`);
                      } else {
                        await addToWatchlist(user.uid, {
                          id: movie.tmdbId,
                          title: movie.title,
                          poster: movie.poster,
                          backdrop: movie.backdrop,
                          media_type: mediaType,
                        });
                        setInList(true);
                        setToast(`"${movie.title}" added to My List`);
                      }
                      setTimeout(() => setToast(null), 3000);
                    }}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                      inList
                        ? "border-green-500 text-green-500 hover:border-green-400 hover:text-green-400"
                        : "border-gray-400 text-gray-400 hover:border-white hover:text-white"
                    }`}
                    title={inList ? "Remove from My List" : "Add to My List"}
                  >
                    {inList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
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

        {/* Seasons and Episodes (If TV Show) */}
        {movie.seasons && movie.seasons.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Episodes</h2>
              <select
                className="bg-gray-800 text-white border border-gray-600 rounded px-4 py-2 outline-none focus:border-white transition-colors"
                value={selectedSeason || ""}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
              >
                {movie.seasons.map(season => (
                  <option key={season.id} value={season.season_number}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
            
            {loadingEpisodes ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {episodes.map(ep => (
                  <div 
                    key={ep.id} 
                    onClick={() => {
                      setPlayingSeason(selectedSeason);
                      setPlayingEpisode(ep.episode_number);
                      setShowPlayer(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      if (user) {
                        addToWatchHistory(user.uid, {
                          id: movie.tmdbId,
                          title: movie.title,
                          poster: movie.poster,
                          backdrop: movie.backdrop,
                          media_type: "tv",
                          season: selectedSeason ?? undefined,
                          episode: ep.episode_number,
                        }).catch(console.error);
                      }
                    }}
                    className={`flex gap-4 p-4 rounded cursor-pointer transition-colors border ${playingSeason === selectedSeason && playingEpisode === ep.episode_number ? 'bg-gray-800 border-gray-500' : 'bg-gray-900/50 hover:bg-gray-800 border-gray-800'}`}
                  >
                    <div className="w-40 aspect-video flex-shrink-0 bg-gray-800 rounded overflow-hidden relative group">
                      {ep.still_path ? (
                        <img src={ep.still_path} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500 text-sm">No Image</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl text-white font-semibold">{ep.episode_number}.</span>
                        <h3 className="text-lg text-white font-medium">{ep.name}</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{ep.air_date ? new Date(ep.air_date).getFullYear() : "Unknown Year"}</p>
                      <p className="text-gray-300 text-sm line-clamp-2">{ep.overview || "No overview available."}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Top Reviews</h2>
            <div className="grid gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-xl font-bold text-white uppercase">
                      {review.author[0]}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{review.author}</h3>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        {review.rating ? (
                          <span className="text-green-500 font-semibold">★ {review.rating}/10</span>
                        ) : (
                          <span className="text-gray-500 text-xs tracking-wider uppercase">No Rating</span>
                        )}
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-[fadeInUp_0.3s_ease-out]">
          <div className="bg-white text-black px-6 py-3 rounded-lg shadow-2xl font-medium text-sm flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
