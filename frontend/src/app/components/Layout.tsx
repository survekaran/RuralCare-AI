
import { Link, Outlet, useLocation } from "react-router";
import { Heart, Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import SwasthyaAuth from "./SwasthyaAuth";
import UserProfile from "./UserProfile";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { isLoggedIn, user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const location = useLocation();

  const isMarathi = language === "mr";

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  const navItems = [
    { name: isMarathi ? "मुख्यपृष्ठ" : "Home", path: "/" },
    { name: isMarathi ? "डॉक्टरांशी बोला" : "Talk to Doctor", path: "/talk-to-doctor" },
    { name: isMarathi ? "लक्षणे तपासा" : "Check Symptoms", path: "/check-symptoms" },
    { name: isMarathi ? "औषधे शोधा" : "Find Medicines", path: "/find-medicines" },
    { name: isMarathi ? "आरोग्य नोंदी" : "Health Records", path: "/health-records" },
    { name: isMarathi ? "आरोग्य टिप्स" : "Health Tips", path: "/health-tips" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between min-h-16 gap-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#4F7DF3] flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="white" />
              </div>

              <span className="text-xl text-[#1E293B]" style={{ fontWeight: 600 }}>
                SwasthAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 xl:px-3 py-2 rounded-lg whitespace-nowrap text-sm xl:text-base transition-colors ${
                    isActive(item.path)
                      ? "bg-[#4F7DF3] text-white"
                      : "text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 min-w-[85px] rounded-full border border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#4F7DF3] hover:text-white transition-colors font-medium whitespace-nowrap"
              >
                {isMarathi ? "English" : "मराठी"}
              </button>

              {/* Profile / Login */}
              {isLoggedIn ? (
                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="w-9 h-9 shrink-0 rounded-full bg-[#4F7DF3] text-white flex items-center justify-center text-sm font-bold shadow-[0_2px_8px_rgba(79,125,243,0.35)] hover:bg-[#3D6DE3] transition-colors"
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
                      className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#4F7DF3] hover:text-white transition-colors whitespace-nowrap"
                      aria-label="Login"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {isMarathi ? "लॉगिन" : "Login"}
                      </span>
                    </button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md p-6">
                    <SwasthyaAuth onClose={() => setLoginOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}

              {/* Consultation */}
              <Link
                to="/talk-to-doctor"
                className="px-4 xl:px-6 py-2.5 bg-[#4F7DF3] text-white rounded-full hover:bg-[#3D6DE3] transition-colors whitespace-nowrap text-sm xl:text-base"
              >
                {isMarathi ? "डॉक्टरांचा सल्ला" : "Get Consultation"}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 shrink-0"
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

              {/* Mobile Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="w-full text-left px-4 py-3 mt-2 rounded-lg border border-[#4F7DF3] text-[#4F7DF3] font-medium"
              >
                {isMarathi ? "Switch to English" : "मराठीमध्ये बदला"}
              </button>

              {/* Mobile Consultation */}
              <Link
                to="/talk-to-doctor"
                className="block mx-4 mt-4 px-6 py-3 bg-[#4F7DF3] text-white rounded-full text-center hover:bg-[#3D6DE3] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {isMarathi ? "डॉक्टरांचा सल्ला घ्या" : "Get Consultation"}
              </Link>

              {/* Mobile Profile / Login */}
              <div className="mx-4 mt-2">

                {isLoggedIn ? (
                  <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-[#4F7DF3] text-white transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="font-medium">
                          {isMarathi ? "माझे प्रोफाइल" : "My Profile"} ({initials})
                        </span>
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
                        <span className="font-medium">
                          {isMarathi ? "लॉगिन" : "Login"}
                        </span>
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

            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#64748B]">

              <Link to="/about" className="hover:text-[#4F7DF3] transition-colors">
                {isMarathi ? "आमच्याबद्दल" : "About"}
              </Link>

              <Link to="/contact" className="hover:text-[#4F7DF3] transition-colors">
                {isMarathi ? "संपर्क" : "Contact"}
              </Link>

              <Link to="/privacy" className="hover:text-[#4F7DF3] transition-colors">
                {isMarathi ? "गोपनीयता धोरण" : "Privacy Policy"}
              </Link>

            </div>
          </div>

          <div className="mt-6 text-center text-sm text-[#64748B]">
            {isMarathi
              ? "ग्रामीण भागातील आरोग्यसेवा सुधारण्यासाठी तयार केलेले."
              : "Built to improve rural healthcare access."}
          </div>

        </div>
      </footer>
    </div>
  );
}
