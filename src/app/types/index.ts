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
}
