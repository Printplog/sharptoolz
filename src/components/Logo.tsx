import { LazyImage } from "@/components/LazyImage";
import { Link } from "react-router-dom";

interface LogoProps {
  icon?: boolean;
  noLink?: boolean;
  size?: number;
  showText?: boolean;
}

export default function Logo({ icon = false, noLink = false, size = 30, showText = true }: LogoProps) {
  const logoImg = (
    <LazyImage
      src="/logo.png"
      alt="SharpToolz - Professional Sample Document Generator"
      className="object-contain"
      style={{ width: size, height: size, backgroundColor: 'transparent' }}
      priority
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
        {showText && <span className="font-bold text-xl text-foreground animate-in fade-in duration-300">SharpToolz</span>}
      </div>
    );
  }

  // Default: icon and text, wrapped in a link to home
  return (
    <div>
      <Link to="/" className="flex items-center gap-2" aria-label="Go to home">
        {logoImg}
        {showText && <span className="font-bold text-xl text-foreground animate-in fade-in duration-300">SharpToolz</span>}
      </Link>
    </div>
  );
}
