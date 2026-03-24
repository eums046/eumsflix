import { Link } from "react-router";
import { Play, Info } from "lucide-react";
import { Movie } from "../types";
import { motion } from "motion/react";

interface MovieCardProps {
  movie: Movie;
  rank?: number;
}

export function MovieCard({ movie, rank }: MovieCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <Link to={`/${movie.media_type || 'movie'}/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-900 group-hover:ring-2 ring-white/50 transition-all">
          {rank && (
            <div className="absolute top-0 left-0 z-20 bg-gradient-to-br from-red-600 to-red-900 text-white font-black text-3xl w-14 h-14 flex items-center justify-center rounded-br-2xl shadow-[4px_4px_12px_rgba(0,0,0,0.5)] border-b border-r border-red-500/30">
              {rank}
            </div>
          )}
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-semibold mb-2">{movie.title}</h3>
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-300">
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.rating}</span>
                <span>•</span>
                <span>{movie.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                  <Play className="w-3 h-3" fill="currentColor" />
                  Play
                </button>
                <button className="flex items-center gap-1 bg-gray-800/80 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-700 transition-colors">
                  <Info className="w-3 h-3" />
                  Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
