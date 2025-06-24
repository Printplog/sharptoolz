import SectionPadding from '@/layouts/SectionPadding';
import { DollarSign, Truck, Shield, Clock } from 'lucide-react';
import LightBlur from '../LightBlur';

export default function FeaturesSection() {
  const features = [
    {
      icon: DollarSign,
      title: "Affordable Pricing",
      description: "Get professional documents at a fraction of the cost. No hidden fees, transparent pricing for all document types.",
      highlight: true
    },
    {
      icon: Truck,
      title: "Real-time Tracking",
      description: "Track your shipment documents in real-time. Get instant updates on status changes and delivery confirmations.",
      highlight: false
    },
    {
      icon: Shield,
      title: "100% Reliable",
      description: "Bank-grade security and 99.9% uptime guarantee. Your documents are safe and always accessible when you need them.",
      highlight: false
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Generate professional documents in seconds. No more waiting days for document preparation and processing.",
      highlight: false
    }
  ];

  return (
    <SectionPadding className="py-20 relative overflow-hidden" id='why-us'>
        <LightBlur className='right-[-150px] top-1/2 -translate-y-1/2 ' />
      <div className="z-[1] relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Why Choose DocsMaker?
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience the perfect blend of affordability, speed, and reliability. 
            Create professional documents with confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  feature.highlight
                    ? 'bg-primary text-white shadow-2xl border-2 border-primary/20'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/15'
                }`}
              >
                {/* Background Gradient for Highlighted Card */}
                {feature.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-br from-background via-gray-900 to-background rounded-2xl opacity-90"></div>
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-all duration-300 ${
                    feature.highlight
                      ? 'bg-white/20 text-white group-hover:bg-white/30'
                      : 'bg-primary/20 text-primary group-hover:bg-primary/30'
                  }`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-4 ${
                    feature.highlight ? 'text-white' : 'text-white'
                  }`}>
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${
                    feature.highlight ? 'text-white/90' : 'text-gray-300'
                  }`}>
                    {feature.description}
                  </p>

                  {/* Decorative Element for Highlighted Card */}
                  {feature.highlight && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                  )}
                </div>

                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
                  feature.highlight
                    ? 'bg-white/5'
                    : 'bg-gradient-to-br from-primary/5 to-transparent'
                }`}></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-gray-300 text-sm">
            <Shield className="w-4 h-4 text-primary" />
            <span>Trusted by 50,000+ businesses worldwide</span>
          </div>
        </div>
      </div>
    </SectionPadding>
  );
}