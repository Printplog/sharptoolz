import { useState } from 'react';
import SectionPadding from '../../layouts/SectionPadding';
import { ClipboardList } from 'lucide-react';


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About Us" },
    { href: "/why-us", label: "Why Us" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="relative z-[999]">
      <SectionPadding className="flex justify-between items-center py-4 lg:py-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <ClipboardList />
          </div>
          <span className="font-bold text-xl text-foreground">DocsMaker</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition-colors font-medium ${
                index === 0
                  ? "text-primary"
                  : "text-foreground/80 hover:text-primary"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-md hover:bg-accent"
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
          <div className="absolute top-full left-0 right-0 lg:hidden bg-background backdrop-blur-lg border-b shadow-lg z-[20]">
            <SectionPadding className="py-4">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`transition-colors font-medium py-2 ${
                      index === 0
                        ? "text-primary"
                        : "text-foreground hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </SectionPadding>
          </div>
        )}
      </SectionPadding>
    </nav>
  );
}