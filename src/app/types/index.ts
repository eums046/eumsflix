export interface Movie {
  id: number;
  title: string;
  description: string;
  year: number;
  rating: string;
  duration: string;
  genre: string[];
  poster: string;
  backdrop: string;
  videoUrl: string;
  cast: string[];
  director: string;
  tmdbId: number;
  media_type?: "movie" | "tv";
  seasons?: Season[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
}

export interface Episode {
  id: number;
  name: string;
  episode_number: number;
  overview: string;
  still_path: string | null;
  air_date: string;
}
