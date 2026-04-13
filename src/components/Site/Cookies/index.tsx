import SectionPadding from "@/layouts/SectionPadding";
import BreadcrumbSEO from "../../BreadcrumbSEO";

export default function CookiePolicy() {
  const lastUpdated = "April 13, 2026";

  const cookies = [
    { type: "Essential", description: "Required for the website to function correctly, such as authentication and security.", duration: "Session", icon: "🔒" },
    { type: "Functional", description: "Remember your preferences and settings for a more personalized experience.", duration: "1 Year", icon: "⚙️" },
    { type: "Analytics", description: "Help us understand how visitors interact with our website to improve our services.", duration: "2 Years", icon: "📊" }
  ];

  return (
    <div className="min-h-screen bg-background text-white/90">
      <SectionPadding className="py-12">
        <BreadcrumbSEO 
          items={[
            { label: "Home", path: "/" },
            { label: "Cookie Policy", path: "/cookies" }
          ]}
        />
      </SectionPadding>

      <SectionPadding>
        <div className="max-w-4xl mx-auto space-y-16">
          <header className="space-y-6 border-b border-white/5 pb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
              Cookie Policy
            </h1>
            <p className="text-white/40 font-medium">Last Updated: {lastUpdated}</p>
          </header>

          <div className="prose prose-invert prose-primary max-w-none space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">What are Cookies?</h2>
              <p className="text-white/60 leading-relaxed text-lg">
                Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site. At SharpToolz, we use cookies to enhance your experience and optimize our document automation platform.
              </p>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl font-bold text-white">Types of Cookies We Use</h2>
              <div className="space-y-4">
                {cookies.map((cookie) => (
                  <div key={cookie.type} className="group p-8 rounded-3xl bg-white/2 border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {cookie.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-white">{cookie.type}</h3>
                          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {cookie.duration}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 leading-relaxed">{cookie.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">How to Manage Cookies</h2>
              <p className="text-white/60 leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can choose to block all cookies, delete existing cookies, or receive a notification when a new cookie is set.
              </p>
              <div className="p-6 rounded-2xl bg-white/2 border border-white/5 flex items-start gap-4">
                 <div className="text-primary mt-1">⚠️</div>
                 <p className="text-sm text-white/40 italic">
                   Note: Disabling certain cookies may impact the functionality of our document generation tools and your overall experience on SharpToolz.
                 </p>
              </div>
            </section>

            <section className="space-y-6 text-center pt-8 border-t border-white/5">
              <h2 className="text-2xl font-bold text-white">Updates to this Policy</h2>
              <p className="text-white/50 text-sm max-w-2xl mx-auto">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. We encourage you to review this page periodically.
              </p>
            </section>
          </div>
        </div>
      </SectionPadding>
    </div>
  );
}
