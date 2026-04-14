import SectionPadding from "@/layouts/SectionPadding";
import ContactForm from "@/components/Site/Contact/ContactForm";
import ContactInfo from "@/components/Site/Contact/ContactInfo";

export default function Contact() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Technical Grid/Dot Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
           style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
      
      <SectionPadding className="pt-16 pb-0 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Simple Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-fancy font-black text-white tracking-tighter uppercase italic mb-6 leading-[0.9]">
              Contact <span className="text-primary">Us</span>
            </h1>
            <p className="text-white/40 max-w-2xl text-lg leading-relaxed font-medium">
              Send us a message if you need help or have any questions about our tools. 
              We are here to help you get your documents done quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Contact Form - Spans 2 columns on lg */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

            {/* Contact Info Sidebar - Spans 1 column */}
            <div className="lg:col-span-1">
              <ContactInfo />
            </div>
          </div>
        </div>
      </SectionPadding>
    </div>
  );
}
