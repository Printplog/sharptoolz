import { ArrowRight, LogIn } from "lucide-react";
import LightBlur from "../LightBlur";
import SectionPadding from "@/layouts/SectionPadding";
import AnimatedFormSection from "./AnimatedForm";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <SectionPadding className="flex flex-col gap-3 items-center justify-center py-10 relative">
      <LightBlur className="left-[-150px] top-0" />
      <h2 className="text-6xl sm:text-6xl md:text-7xl font-fancy text-center md:w-[80%] font-semibold">
        Create Professional Sample Documents in Seconds
      </h2>
      <p className="w-[90%] md:w-[70%] text-center text-foreground/80">
        Generate professional-looking sample documents instantly. Perfect for
        testing, development, and demonstrations. Create invoices, contracts,
        reports and more with just a few clicks.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/all-tools">
          <button className="bg-lime-600 border-3 border-primary text-background flex gap-2 items-center px-8 font-bold py-3 rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500">
            Get Started
            <ArrowRight className="group-hover:translate-x-[5px] transition-all duration-500" />
          </button>
        </Link>
        <Link to="/auth/login">
          <button className="bg-white/10 hover:bg-white/5 border-3 border-white/20 text-white flex gap-2 items-center px-8 font-bold py-3 rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500">
            Login
            <LogIn className="group-hover:translate-x-[5px] transition-all duration-500" />
          </button>
        </Link>
      </div>
      <AnimatedFormSection />
    </SectionPadding>
  );
}
