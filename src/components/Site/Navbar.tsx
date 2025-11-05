import { useState } from "react";
import SectionPadding from "../../layouts/SectionPadding";
import { Button } from "../ui/button";
import { Link, useLocation } from "react-router-dom";
import Logo from "../Logo";
import { useAuthStore } from "@/store/authStore";
import { User } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = useLocation().pathname;
  const { isAuthenticated } = useAuthStore();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/all-tools", label: "All Tools" },
    { href: "/tutorials", label: "Tutorials" },
    {
      href: "https://chat.whatsapp.com/HMkF0uqv3ksC0QvNbr8Mqu",
      label: "Community",
    },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-[999] backdrop-blur-lg">
      <div className="relative">
        <SectionPadding className="flex justify-between items-center py-4 lg:py-10">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.href}
                target={link.href.startsWith("http") ? "_blank" : "_self"}
                className={`transition-colors font-medium ${
                  link.href === pathname
                    ? "text-primary"
                    : "text-foreground/80 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="font-semibold hidden lg:flex border border-primary/10 rounded-full w-fit px-[25px] cursor-pointer bg-primary/5 hover:bg-primary/10">
                <User className="w-4 h-4 text-primary" />
                <span className="text-primary">Dashboard</span>
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link to="/auth/login">
                <Button className="font-semibold hidden lg:block rounded-full w-fit px-[25px] cursor-pointer">
                  Login
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button className="font-semibold hidden lg:block rounded-full w-fit px-[25px] bg-white/10 hover:bg-white/5 border text-white border-white/20 cursor-pointer">
                  Register
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-black/20"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 lg:hidden bg-background backdrop-blur-lg border-b shadow-lg z-[20] border-black">
              <SectionPadding className="py-4">
                <div className="flex flex-col space-y-4">
                  {navLinks.map((link, index) => (
                    <Link
                      key={index}
                      to={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`transition-colors font-medium py-2 ${
                        link.href === pathname
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Auth Actions (Mobile) */}
                  {isAuthenticated ? (
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full font-semibold rounded-full px-[25px] cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/10">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-primary ml-2">Dashboard</span>
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link to="/auth/login" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full font-semibold rounded-full px-[25px] cursor-pointer">
                          Login
                        </Button>
                      </Link>
                      <Link to="/auth/register" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full font-semibold rounded-full px-[25px] bg-white/10 hover:bg-white/5 border text-white border-white/20 cursor-pointer">
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SectionPadding>
            </div>
          )}
        </SectionPadding>
      </div>
    </nav>
  );
}
