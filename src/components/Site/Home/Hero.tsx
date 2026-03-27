import { ArrowRight } from "lucide-react";
import LightBlur from "../LightBlur";
import SectionPadding from "@/layouts/SectionPadding";
import AnimatedFormSection from "./AnimatedForm";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function Hero() {
  return (
    <SectionPadding className="flex flex-col items-center justify-center text-center pt-12 md:pt-12 relative">
      <LightBlur />
      <h2 className="text-[38px] sm:text-6xl md:text-7xl max-w-4xl font-fancy text-center font-semibold leading-[1.1] tracking-tight">
        Create Professional and Realistic Sample {' '}
        <span className="text-[#cee88c] drop-shadow-[0_0_15px_rgba(206,232,140,0.3)]">
           Documents in Seconds
        </span>.
      </h2>
      <p className="text-white/60 text-base md:text-lg max-w-2xl mt-6 font-medium">
        Generate professional-looking sample documents instantly. Perfect for
        testing, development, and demonstrations. Create invoices, contracts,
        reports and more with just a few clicks.
      </p>
      <div className="flex items-center gap-4 mt-2">
        <PremiumButton 
          text="Get Started" 
          icon={ArrowRight} 
          href="/all-tools" 
          variant="primary" 
        />

        <PremiumButton 
          text="Login" 
          icon={ArrowRight} 
          href="/auth/login" 
          variant="ghost" 
        />
      </div>
      <AnimatedFormSection />
    </SectionPadding>
  );
}
