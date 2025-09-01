import { Link } from "react-router-dom";
import React from "react";

/**
 * Logo component
 *
 * Props:
 * - alone?: boolean - If true, only show the logo image (no text, no link)
 * - noLink?: boolean - If true, do not wrap in a link (just render the logo and text)
 * - size?: number - Size in pixels for the logo image (default: 30)
 */
interface LogoProps {
  icon?: boolean;
  noLink?: boolean;
  size?: number;
}

export default function Logo({ icon = false, noLink = false, size = 30 }: LogoProps) {
  // Debugging: Print props for tracing
  // Print($"Logo rendered with alone={alone}, noLink={noLink}, size={size}");

  const logoImg = (
    <img
      src="/logo.png"
      alt="SharpToolz Logo"
      className="object-contain"
      style={{ width: size, height: size }}
    />
  );

  // If alone, show only the icon, no text, no link
  if (icon) {
    return (
      <div className="flex items-center justify-center">
        {logoImg}
      </div>
    );
  }

  // If noLink, show icon and text, but not wrapped in a link
  if (noLink) {
    return (
      <div className="flex items-center gap-2">
        {logoImg}
        <span className="font-bold text-xl text-foreground">SharpToolz</span>
      </div>
    );
  }

  // Default: icon and text, wrapped in a link to home
  return (
    <div>
      <Link to="/" className="flex items-center gap-2" aria-label="Go to home">
        {logoImg}
        <span className="font-bold text-xl text-foreground">SharpToolz</span>
      </Link>
    </div>
  );
}
