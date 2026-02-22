import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import Logo from "../Logo";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });
  return (
    <div className="mt-[120px] p-2 sm:p-5">
      <footer className="bg-black rounded-2xl text-foreground py-12">
        <div className="container mx-auto px-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="mb-4">
              <Logo noLink={true} size={30} />
            </div>
            <p className="text-sm">
              Create professional sample documents in seconds. Perfect for
              testing, development, and demonstrations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="#home"
                  className="hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="#services"
                  className="hover:text-primary transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  to="#about-us"
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="#why-us"
                  className="hover:text-primary transition-colors"
                >
                  Why Us
                </Link>
              </li>
              <li>
                <Link
                  to="#testimonials"
                  className="hover:text-primary transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="#contact"
                  className="hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect with Us */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect with Us</h4>
            <ul className="flex space-x-4 text-sm">
              {settings?.twitter_link && (
                <li>
                  <a href={settings.twitter_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <i className="fab fa-twitter"></i>
                  </a>
                </li>
              )}
              {settings?.instagram_link && (
                <li>
                  <a href={settings.instagram_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <i className="fab fa-instagram"></i>
                  </a>
                </li>
              )}
              {settings?.telegram_link && (
                <li>
                  <a href={settings.telegram_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <i className="fab fa-telegram"></i>
                  </a>
                </li>
              )}
              {settings?.whatsapp_community_link && (
                <li>
                  <a href={settings.whatsapp_community_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    <i className="fab fa-whatsapp"></i>
                  </a>
                </li>
              )}
              {/* Fallback icons if no settings found - strictly adhering to showing nothing if empty */}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="container mx-auto px-6 w-[90%] mt-8 border-t border-gray-700 pt-6 text-center text-sm">
          <p>&copy; 2025 Sharptoolz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
