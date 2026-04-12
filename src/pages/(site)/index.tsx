import FeaturesSection from "@/components/Site/Home/Features";
import Hero from "@/components/Site/Home/Hero";
import SocialsSection from "@/components/Site/Home/SocialsSection";
import ReviewsSection from "@/components/Site/Home/ReviewsSection";
import Tools from "@/components/Site/Home/Tools";
import DisclaimerSection from "@/components/Site/Home/DisclaimerSection";
import ApiComingSoon from "@/components/Site/Home/ApiComingSoon";

import SEO from "@/components/SEO";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SharpToolz",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "description": "Generate professional-looking sample documents instantly. Perfect for testing, development, and demonstrations.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <div>
      <SEO 
        title="Professional Document Generator" 
        description="The ultimate tool for creating realistic sample documents for testing, development, and demonstrations."
        canonical="/"
      />
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
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