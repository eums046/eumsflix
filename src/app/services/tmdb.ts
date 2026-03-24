import { Movie } from "../types";

const API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || "YOUR_TMDB_API_KEY";
const BASE_URL = "https://api.themoviedb.org/3";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const STILL_URL = "https://image.tmdb.org/t/p/w300";

// ── In-memory cache (5 min TTL) ──────────────────────────────────────
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const fetchFromTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(cacheKey);
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status}`);
  }
  const data = await response.json();
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
};

const mapTMDBMovie = async (tmdbMovie: any, fullDetails = false, forceType?: "movie"|"tv"): Promise<Movie> => {
  let cast: string[] = [];
  let director = "Unknown";
  let duration = "2h 00m";
  let rating = "PG-13";
  let genres: string[] = [];
  let seasons: any[] = [];
  
  const type = forceType || tmdbMovie.media_type || (tmdbMovie.name ? "tv" : "movie");

  if (fullDetails) {
    try {
      const detailsEndpoint = type === "tv" ? `/tv/${tmdbMovie.id}` : `/movie/${tmdbMovie.id}`;
      const creditsEndpoint = type === "tv" ? `/tv/${tmdbMovie.id}/credits` : `/movie/${tmdbMovie.id}/credits`;
      const ratingsEndpoint = type === "movie"
        ? `/movie/${tmdbMovie.id}/release_dates`
        : `/tv/${tmdbMovie.id}/content_ratings`;

      // Fetch all 3 in parallel instead of sequentially
      const [details, credits, ratingsData] = await Promise.all([
        fetchFromTMDB(detailsEndpoint),
        fetchFromTMDB(creditsEndpoint),
        fetchFromTMDB(ratingsEndpoint)
      ]);

      if (type === "movie" && details.runtime) {
        duration = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`;
      } else if (type === "tv" && details.episode_run_time?.length > 0) {
        duration = `${details.episode_run_time[0]}m per ep`;
      }

      if (details.genres) {
        genres = details.genres.map((g: any) => g.name);
      }
      if (credits.cast) {
        cast = credits.cast.slice(0, 4).map((c: any) => c.name);
      }
      if (credits.crew) {
        const d = credits.crew.find((c: any) => c.job === "Director" || c.job === "Executive Producer");
        if (d) director = d.name;
      }
      
      if (type === "movie") {
        const usRelease = ratingsData.results?.find((r: any) => r.iso_3166_1 === "US");
        if (usRelease && usRelease.release_dates.length > 0) {
          const cert = usRelease.release_dates[0].certification;
          if (cert) rating = cert;
        }
      } else {
        const usRating = ratingsData.results?.find((r: any) => r.iso_3166_1 === "US");
        if (usRating) rating = usRating.rating;
        else rating = "TV-14";
        
        if (details.seasons) {
          seasons = details.seasons
            .filter((s: any) => s.season_number > 0)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              season_number: s.season_number,
              episode_count: s.episode_count
            }));
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch full details for ${tmdbMovie.id}`, e);
    }
  } else {
    genres = tmdbMovie.genre_ids ? [type === "tv" ? "TV Show" : "Movie"] : [];
  }

  return {
    id: tmdbMovie.id,
    tmdbId: tmdbMovie.id,
    media_type: type as any,
    title: tmdbMovie.title || tmdbMovie.name || "Unknown Title",
    description: tmdbMovie.overview || "No description available.",
    year: (tmdbMovie.release_date || tmdbMovie.first_air_date) ? parseInt((tmdbMovie.release_date || tmdbMovie.first_air_date).substring(0, 4)) : new Date().getFullYear(),
    rating: rating,
    duration: duration,
    genre: genres,
    poster: tmdbMovie.poster_path ? `${POSTER_URL}${tmdbMovie.poster_path}` : "https://via.placeholder.com/500x750",
    backdrop: tmdbMovie.backdrop_path ? `${BACKDROP_URL}${tmdbMovie.backdrop_path}` : "https://via.placeholder.com/1200x675",
    videoUrl: "",
    cast: cast,
    director: director,
    seasons: seasons.length > 0 ? seasons : undefined,
  };
};

export const searchMoviesAndSeries = async (query: string): Promise<Movie[]> => {
  if (!query) return [];
  const data = await fetchFromTMDB("/search/multi", { query, include_adult: "false" });
  const mediaItems = data.results.filter((item: any) => item.media_type === "movie" || item.media_type === "tv");
  return Promise.all(mediaItems.slice(0, 18).map((m: any) => mapTMDBMovie(m, false)));
};

export interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for: Movie[];
}

export const searchPeople = async (query: string): Promise<PersonResult[]> => {
  if (!query) return [];
  const data = await fetchFromTMDB("/search/multi", { query, include_adult: "false" });
  const people = data.results.filter((item: any) => item.media_type === "person");
  const mapped = await Promise.all(
    people.slice(0, 6).map(async (p: any) => {
      const knownFor = await Promise.all(
        (p.known_for || [])
          .filter((k: any) => k.media_type === "movie" || k.media_type === "tv")
          .slice(0, 4)
          .map((k: any) => mapTMDBMovie(k, false))
      );
      return {
        id: p.id,
        name: p.name,
        profile_path: p.profile_path ? `${POSTER_URL}${p.profile_path}` : null,
        known_for_department: p.known_for_department || "Acting",
        known_for: knownFor,
      };
    })
  );
  return mapped;
};

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string;
  birthday: string | null;
  place_of_birth: string | null;
}

export const getPersonDetails = async (id: number): Promise<PersonDetails> => {
  const data = await fetchFromTMDB(`/person/${id}`);
  return {
    id: data.id,
    name: data.name,
    biography: data.biography || "",
    profile_path: data.profile_path ? `${POSTER_URL}${data.profile_path}` : null,
    known_for_department: data.known_for_department || "Acting",
    birthday: data.birthday,
    place_of_birth: data.place_of_birth,
  };
};

export const getPersonCredits = async (id: number): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/person/${id}/combined_credits`);
  const allCredits = [...(data.cast || []), ...(data.crew || [])];
  // Deduplicate by id and sort by popularity
  const seen = new Set<number>();
  const unique = allCredits.filter((c: any) => {
    if (seen.has(c.id)) return false;
    if (c.media_type !== "movie" && c.media_type !== "tv") return false;
    seen.add(c.id);
    return true;
  });
  unique.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
  return Promise.all(unique.slice(0, 24).map((m: any) => mapTMDBMovie(m, false)));
};

// ── Home page rows (share the trending call via cache) ───────────────
export const getTop10MoviesToday = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

export const getTop10SeriesToday = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/tv/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "tv")));
};

export const getTrendingMovies = getTop10MoviesToday; // same endpoint, now uses cache

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/popular");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

export const getNewReleases = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/now_playing");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

export const getMostWatchedMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/top_rated");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

export const getFeaturedMovie = async (): Promise<Movie> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  if (data.results && data.results.length > 0) {
    return mapTMDBMovie(data.results[0], true, "movie");
  }
  throw new Error("No featured movies found.");
};

export const getMovieDetails = async (id: number, type: "movie" | "tv" = "movie"): Promise<Movie> => {
  const data = await fetchFromTMDB(`/${type}/${id}`);
  return mapTMDBMovie(data, true, type);
};

export const getSimilarMovies = async (id: number, type: "movie" | "tv" = "movie"): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/${type}/${id}/similar`);
  return Promise.all(data.results.slice(0, 6).map((m: any) => mapTMDBMovie(m, false, type)));
};

export const getSeasonDetails = async (seriesId: number, seasonNumber: number) => {
  const data = await fetchFromTMDB(`/tv/${seriesId}/season/${seasonNumber}`);
  return data.episodes.map((ep: any) => ({
    id: ep.id,
    name: ep.name,
    episode_number: ep.episode_number,
    overview: ep.overview,
    still_path: ep.still_path ? `${STILL_URL}${ep.still_path}` : null,
    air_date: ep.air_date
  }));
};

export const getMovieReviews = async (id: number, type: "movie" | "tv" = "movie") => {
  const data = await fetchFromTMDB(`/${type}/${id}/reviews`);
  return data.results.slice(0, 5).map((r: any) => ({
    id: r.id,
    author: r.author,
    content: r.content,
    rating: r.author_details?.rating || null,
    created_at: r.created_at
  }));
};

export const getGenres = async (): Promise<{id: number, name: string}[]> => {
    const data = await fetchFromTMDB("/genre/movie/list");
    return data.genres;
}

export const getMoviesByGenreId = async (genreId: string): Promise<Movie[]> => {
    const data = await fetchFromTMDB("/discover/movie", { with_genres: genreId });
    return Promise.all(data.results.slice(0, 20).map((m: any) => mapTMDBMovie(m, false, "movie")));
}
