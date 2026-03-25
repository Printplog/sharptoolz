import FeaturesSection from "@/components/Site/Home/Features";
import Hero from "@/components/Site/Home/Hero";
import SocialsSection from "@/components/Site/Home/SocialsSection";
import ReviewsSection from "@/components/Site/Home/ReviewsSection";
import Tools from "@/components/Site/Home/Tools";
import DisclaimerSection from "@/components/Site/Home/DisclaimerSection";
import ApiComingSoon from "@/components/Site/Home/ApiComingSoon";

export default function Home() {
  return (
    <div>
      <Hero />
      <Tools />
      <FeaturesSection />
      <ReviewsSection />
      <DisclaimerSection />
      <SocialsSection />
      <ApiComingSoon />
    </div>
  )
}