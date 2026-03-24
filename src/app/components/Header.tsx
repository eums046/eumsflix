import { Link, useLocation, useNavigate } from "react-router";
import { Search as SearchIcon, Bell, User } from "lucide-react";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/95 backdrop-blur-sm" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-red-600 text-3xl font-black tracking-tight">
              EUMSFLIX
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm transition-colors hover:text-white ${
                  isActive("/") ? "text-white font-medium" : "text-gray-400"
                }`}
              >
                Home
              </Link>
              <Link
                to="/browse"
                className={`text-sm transition-colors hover:text-white ${
                  isActive("/browse") ? "text-white font-medium" : "text-gray-400"
                }`}
              >
                Browse
              </Link>
              <Link
                to="/browse"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                My List
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex items-center">
              {isSearchOpen && (
                <input
                  type="text"
                  autoFocus
                  placeholder="Titles, people, genres"
                  className="bg-black/80 border border-white/50 text-white px-3 py-1 mr-2 text-sm focus:outline-none focus:border-white transition-all w-48 md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                />
              )}
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <SearchIcon className="w-5 h-5" />
              </button>
            </form>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}