import SectionPadding from "@/layouts/SectionPadding";
import BreadcrumbSEO from "../../BreadcrumbSEO";

export default function TermsOfService() {
  const lastUpdated = "April 13, 2026";

  return (
    <div className="min-h-screen bg-background text-white/90">
      <SectionPadding className="py-12">
        <BreadcrumbSEO 
          items={[
            { label: "Home", path: "/" },
            { label: "Terms of Service", path: "/terms" }
          ]}
        />
      </SectionPadding>

      <SectionPadding>
        <div className="max-w-4xl mx-auto space-y-16">
          <header className="space-y-6 border-b border-white/5 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-white/40 font-medium">Last Updated: {lastUpdated}</p>
          </header>

          <div className="prose prose-invert prose-primary max-w-none space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">01. Agreement to Terms</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                By accessing or using SharpToolz, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our service. These terms constitute a legally binding agreement between you and SharpToolz.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">02. License & Use</h2>
              <p className="text-white/60 leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable license to access and use SharpToolz for your personal or internal business purposes.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                 {[
                   "Automated document generation",
                   "Template customization",
                   "High-fidelity exporting",
                   "Batch processing tools"
                 ].map((feature) => (
                   <div key={feature} className="flex items-center gap-3 p-4 rounded-2xl bg-white/2 border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{feature}</span>
                   </div>
                 ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">03. User Responsibilities</h2>
              <p className="text-white/60 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to:
              </p>
              <ul className="space-y-4 text-white/50 text-sm list-inside list-decimal">
                <li>Use the service for any illegal or unauthorized purpose.</li>
                <li>Attempt to reverse engineer or harvest the platform's source code.</li>
                <li>Generate documents containing malicious content or misinformation.</li>
                <li>Exceed the usage limits defined by your subscription tier.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">04. Payments & Subscriptions</h2>
              <p className="text-white/60 leading-relaxed">
                Certain features require a paid subscription. All fees are non-refundable unless required by law. We reserve the right to modify subscription pricing with reasonable notice.
              </p>
              <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-indigo-300 text-sm italic italic">
                  "SharpToolz reserves the right to terminate accounts that violate payment terms or engage in fraudulent billing activities."
                </p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white uppercase tracking-wider text-sm opacity-50">05. Limitation of Liability</h2>
              <p className="text-white/60 leading-relaxed">
                SharpToolz shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section className="space-y-8 bg-white/2 p-8 rounded-[40px] border border-white/5">
              <h2 className="text-2xl font-bold text-white">Need Clarification?</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                If you have any questions regarding these terms, please don't hesitate to reach out to our support team.
              </p>
              <a href="mailto:support@sharptoolz.com">
                <button className="px-8 py-4 rounded-2xl bg-primary text-black font-bold hover:scale-105 transition-transform active:scale-95 cursor-pointer">
                  Contact Support
                </button>
              </a>
            </section>
          </div>
        </div>
      </SectionPadding>
    </div>
  );
}
