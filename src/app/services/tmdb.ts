import { Movie } from "../types";

const API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || "YOUR_TMDB_API_KEY";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const fetchFromTMDB = async (endpoint: string, params: Record<string, string> = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", API_KEY);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API Error: ${response.status}`);
  }
  return response.json();
};

const mapTMDBMovie = async (tmdbMovie: any, fullDetails = false): Promise<Movie> => {
  let cast: string[] = [];
  let director = "Unknown";
  let duration = "2h 00m"; // Default fallback
  let rating = "PG-13"; // Default fallback
  let genres: string[] = [];

  if (fullDetails) {
    try {
      // Fetch additional details if requested
      const details = await fetchFromTMDB(`/movie/${tmdbMovie.id}`);
      const credits = await fetchFromTMDB(`/movie/${tmdbMovie.id}/credits`);
      const releaseDates = await fetchFromTMDB(`/movie/${tmdbMovie.id}/release_dates`);

      if (details.runtime) {
        duration = `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`;
      }
      if (details.genres) {
        genres = details.genres.map((g: any) => g.name);
      }
      if (credits.cast) {
        cast = credits.cast.slice(0, 4).map((c: any) => c.name);
      }
      if (credits.crew) {
        const d = credits.crew.find((c: any) => c.job === "Director");
        if (d) director = d.name;
      }
      
      const usRelease = releaseDates.results?.find((r: any) => r.iso_3166_1 === "US");
      if (usRelease && usRelease.release_dates.length > 0) {
        const cert = usRelease.release_dates[0].certification;
        if (cert) rating = cert;
      }
    } catch (e) {
      console.warn(`Failed to fetch full details for ${tmdbMovie.id}`, e);
    }
  } else {
    // Basic mapping without extra network requests
    genres = tmdbMovie.genre_ids ? ["Movie"] : []; // In a real app we'd map genre IDs
  }

  return {
    id: tmdbMovie.id, // We use tmdbId as the primary ID now
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name || "Unknown Title",
    description: tmdbMovie.overview || "No description available.",
    year: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.substring(0, 4)) : new Date().getFullYear(),
    rating: rating,
    duration: duration,
    genre: genres,
    poster: tmdbMovie.poster_path ? `${IMAGE_BASE_URL}${tmdbMovie.poster_path}` : "https://via.placeholder.com/500x750",
    backdrop: tmdbMovie.backdrop_path ? `${IMAGE_BASE_URL}${tmdbMovie.backdrop_path}` : "https://via.placeholder.com/1200x675",
    videoUrl: "", // No longer needed since Vidking handles this
    cast: cast,
    director: director,
  };
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false)));
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/popular");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false)));
};

export const getNewReleases = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/now_playing");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false)));
};

export const getMostWatchedMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/movie/top_rated");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false)));
};

export const getFeaturedMovie = async (): Promise<Movie> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  if (data.results && data.results.length > 0) {
    // Get full details for the featured movie to display correctly on the hero
    return mapTMDBMovie(data.results[0], true);
  }
  throw new Error("No featured movies found.");
};

export const getMovieDetails = async (id: number): Promise<Movie> => {
  const data = await fetchFromTMDB(`/movie/${id}`);
  return mapTMDBMovie(data, true);
};

export const getSimilarMovies = async (id: number): Promise<Movie[]> => {
  const data = await fetchFromTMDB(`/movie/${id}/similar`);
  return Promise.all(data.results.slice(0, 6).map((m: any) => mapTMDBMovie(m, false)));
};

export const getGenres = async (): Promise<{id: number, name: string}[]> => {
    const data = await fetchFromTMDB("/genre/movie/list");
    return data.genres;
}

export const getMoviesByGenreId = async (genreId: string): Promise<Movie[]> => {
    // TMDB expects comma separated genre IDs for with_genres
    const data = await fetchFromTMDB("/discover/movie", { with_genres: genreId });
    return Promise.all(data.results.slice(0, 20).map((m: any) => mapTMDBMovie(m, false)));
}
