import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <div>
      <Link to="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="" className="size-[30px]" />
        <span className="font-bold text-xl text-foreground">SharpToolz</span>
      </Link>
    </div>
  );
}
