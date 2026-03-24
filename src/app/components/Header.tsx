import { Link, useLocation, useNavigate } from "react-router";
import { Search as SearchIcon, Bell, User, LogOut, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowProfileMenu(false);
    navigate("/");
  };

  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold text-sm hover:ring-2 ring-white/50 transition-all"
                >
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-white text-sm font-medium truncate">{user.displayName || "User"}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/history"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      Watch History
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-900 hover:text-white transition-colors text-sm border-t border-gray-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}