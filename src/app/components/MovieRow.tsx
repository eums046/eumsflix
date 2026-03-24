import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import { Movie } from "../types";
import { useRef } from "react";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  isTop10?: boolean;
}

export function MovieRow({ title, movies, isTop10 }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 800;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-white mb-4 px-4">{title}</h2>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/70 flex items-center justify-center"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.slice(0, isTop10 ? 10 : undefined).map((movie, index) => (
            <div key={movie.id} className={`flex-shrink-0 ${isTop10 ? "w-64" : "w-48"}`}>
              <MovieCard movie={movie} rank={isTop10 ? index + 1 : undefined} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 text-white opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/70 flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
