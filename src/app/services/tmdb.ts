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

const mapTMDBMovie = async (tmdbMovie: any, fullDetails = false, forceType?: "movie"|"tv"): Promise<Movie> => {
  let cast: string[] = [];
  let director = "Unknown";
  let duration = "2h 00m"; // Default fallback
  let rating = "PG-13"; // Default fallback
  let genres: string[] = [];
  let seasons: any[] = [];
  
  const type = forceType || tmdbMovie.media_type || (tmdbMovie.name ? "tv" : "movie");

  if (fullDetails) {
    try {
      const detailsEndpoint = type === "tv" ? `/tv/${tmdbMovie.id}` : `/movie/${tmdbMovie.id}`;
      const creditsEndpoint = type === "tv" ? `/tv/${tmdbMovie.id}/credits` : `/movie/${tmdbMovie.id}/credits`;
      
      const details = await fetchFromTMDB(detailsEndpoint);
      const credits = await fetchFromTMDB(creditsEndpoint);

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
        const releaseDates = await fetchFromTMDB(`/movie/${tmdbMovie.id}/release_dates`);
        const usRelease = releaseDates.results?.find((r: any) => r.iso_3166_1 === "US");
        if (usRelease && usRelease.release_dates.length > 0) {
          const cert = usRelease.release_dates[0].certification;
          if (cert) rating = cert;
        }
      } else {
        const contentRatings = await fetchFromTMDB(`/tv/${tmdbMovie.id}/content_ratings`);
        const usRating = contentRatings.results?.find((r: any) => r.iso_3166_1 === "US");
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
    poster: tmdbMovie.poster_path ? `${IMAGE_BASE_URL}${tmdbMovie.poster_path}` : "https://via.placeholder.com/500x750",
    backdrop: tmdbMovie.backdrop_path ? `${IMAGE_BASE_URL}${tmdbMovie.backdrop_path}` : "https://via.placeholder.com/1200x675",
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

export const getTop10MoviesToday = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

export const getTop10SeriesToday = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/tv/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "tv")));
};

// Existing Endpoints
export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await fetchFromTMDB("/trending/movie/day");
  return Promise.all(data.results.slice(0, 10).map((m: any) => mapTMDBMovie(m, false, "movie")));
};

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
    still_path: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : null,
    air_date: ep.air_date
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
