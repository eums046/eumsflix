import { Link, useLocation } from "react-router";
import { Search, Bell, User } from "lucide-react";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

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
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
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