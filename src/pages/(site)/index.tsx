import FeaturesSection from "@/components/Site/Home/Features";
import Hero from "@/components/Site/Home/Hero";
import SocialsSection from "@/components/Site/Home/SocialsSection";
import ReviewsSection from "@/components/Site/Home/ReviewsSection";
import Tools from "@/components/Site/Home/Tools";
import DisclaimerSection from "@/components/Site/Home/DisclaimerSection";
import ApiComingSoon from "@/components/Site/Home/ApiComingSoon";
import SEO from "@/components/SEO";

export default function Home() {
  const softwareSchema = {
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SharpToolz",
    "url": "https://sharptoolz.com",
    "logo": "https://sharptoolz.com/logo.png",
    "sameAs": [
        "https://facebook.com/sharptoolz",
        "https://twitter.com/sharptoolz",
        "https://instagram.com/sharptoolz"
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+2348147929994",
        "contactType": "customer service"
    }
  };

  return (
    <div>
      <SEO 
        title="Professional Sample Document Generator & Automation" 
        description="Create realistic sample documents for testing, development, and demonstrations with SharpToolz. The ultimate professional tool for rapid document automation."
        canonical="/"
      />
      <script type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
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