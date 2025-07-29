import FeaturesSection from "@/components/Site/Home/Features";
import Hero from "@/components/Site/Home/Hero";
import JoinCommunity from "@/components/Site/Home/JoinCommunity";
import Tools from "@/components/Site/Home/Tools";

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturesSection />
      <Tools />
      <JoinCommunity />
    </div>
  )
}