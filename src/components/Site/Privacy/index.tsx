import SectionPadding from "@/layouts/SectionPadding";
import BreadcrumbSEO from "../../BreadcrumbSEO";

export default function PrivacyPolicy() {
  const lastUpdated = "April 13, 2026";

  return (
    <div className="min-h-screen bg-background text-white/90">
      <SectionPadding className="py-12">
        <BreadcrumbSEO 
          items={[
            { label: "Home", path: "/" },
            { label: "Privacy Policy", path: "/privacy" }
          ]}
        />
      </SectionPadding>

      <SectionPadding>
        <div className="max-w-4xl mx-auto space-y-16">
          <header className="space-y-6 border-b border-white/5 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-white/40 font-medium">Last Updated: {lastUpdated}</p>
          </header>

          <div className="prose prose-invert prose-primary max-w-none space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">1. Introduction</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                Welcome to SharpToolz ("we," "our," or "us"). We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, and safeguard your data when you use our platform and services.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-white/2 border border-white/5 space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Personal Data</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Account information including email address, full name, and billing details provided during registration or subscription.
                  </p>
                </div>
                <div className="p-8 rounded-3xl bg-white/2 border border-white/5 space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Usage Data</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Information about how you interact with our platform, including IP addresses, browser types, and document generation patterns.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">3. How We Use Your Information</h2>
              <ul className="space-y-4 text-white/60 list-disc list-inside marker:text-primary">
                <li>To provide and maintain our Service, including document automation and generation.</li>
                <li>To manage your Account and provide customer support.</li>
                <li>To process payments and prevent fraudulent transactions.</li>
                <li>To improve our platform based on usage analysis and feedback.</li>
                <li>To communicate with you about updates, security alerts, and promotional offers.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
              <p className="text-white/60 leading-relaxed">
                We implement industry-standard security measures to protect your data. All document generation is performed in secure, stateless environments, ensuring that your sensitive data is never stored longer than necessary for processing.
              </p>
              <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
                <p className="text-primary/80 text-sm font-medium">
                  Note: While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">5. Your Rights</h2>
              <p className="text-white/60 leading-relaxed">
                Depending on your location, you may have rights regarding your personal data, including:
              </p>
              <div className="flex flex-wrap gap-3">
                {['Access', 'Rectification', 'Erasure', 'Portability', 'Object to Processing'].map((right) => (
                  <span key={right} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/40">
                    {right}
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">6. Contact Us</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                If you have any questions about this Privacy Policy, please contact our Data Protection Officer at 
                <span className="text-primary font-bold ml-1">support@sharptoolz.com</span>.
              </p>
            </section>
          </div>
        </div>
      </SectionPadding>
    </div>
  );
}
