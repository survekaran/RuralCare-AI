import { Link, Outlet, useLocation } from "react-router";
import { Heart, Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import SwasthyaAuth from "./SwasthyaAuth";
import UserProfile from "./UserProfile";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Talk to Doctor", path: "/talk-to-doctor" },
    { name: "Check Symptoms", path: "/check-symptoms" },
    { name: "Find Medicines", path: "/find-medicines" },
    { name: "Health Records", path: "/health-records" },
    { name: "Health Tips", path: "/health-tips" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#4F7DF3] flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-xl text-[#1E293B]" style={{ fontWeight: 600 }}>
                SwasthAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-[#4F7DF3] text-white"
                      : "text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* CTA + Login/Profile - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {isLoggedIn ? (
                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="w-9 h-9 rounded-full bg-[#4F7DF3] text-white flex items-center justify-center text-sm font-bold shadow-[0_2px_8px_rgba(79,125,243,0.35)] hover:bg-[#3D6DE3] transition-colors"
                      aria-label="Profile"
                    >
                      {initials}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-6">
                    <UserProfile onClose={() => setProfileOpen(false)} />
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#4F7DF3] hover:text-white transition-colors"
                      aria-label="Login"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="text-sm font-medium">Login</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md p-6">
                    <SwasthyaAuth onClose={() => setLoginOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
              <Link
                to="/talk-to-doctor"
                className="px-6 py-2.5 bg-[#4F7DF3] text-white rounded-full hover:bg-[#3D6DE3] transition-colors"
              >
                Get Consultation
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#1E293B]" />
              ) : (
                <Menu className="w-6 h-6 text-[#1E293B]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 pt-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-[#4F7DF3] text-white"
                      : "text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/talk-to-doctor"
                className="block mx-4 mt-4 px-6 py-3 bg-[#4F7DF3] text-white rounded-full text-center hover:bg-[#3D6DE3] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Consultation
              </Link>
              <div className="mx-4 mt-2">
                {isLoggedIn ? (
                  <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-[#4F7DF3] text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="font-medium">My Profile ({initials})</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md p-6">
                      <UserProfile onClose={() => setProfileOpen(false)} />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full border border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#4F7DF3] hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="w-4 h-4" />
                        <span className="font-medium">Login</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md p-6">
                      <SwasthyaAuth onClose={() => setLoginOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#4F7DF3] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <span className="text-[#1E293B]" style={{ fontWeight: 600 }}>
                SwasthAI
              </span>
            </div>

            <div className="flex gap-6 text-sm text-[#64748B]">
              <Link to="/about" className="hover:text-[#4F7DF3] transition-colors">
                About
              </Link>
              <Link to="/contact" className="hover:text-[#4F7DF3] transition-colors">
                Contact
              </Link>
              <Link to="/privacy" className="hover:text-[#4F7DF3] transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-[#64748B]">
            Built to improve rural healthcare access.
          </div>
        </div>
      </footer>
    </div>
  );
}
