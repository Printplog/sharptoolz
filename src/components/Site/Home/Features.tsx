import SectionPadding from '@/layouts/SectionPadding';
import { DollarSign, Truck, Shield, Clock } from 'lucide-react';
import LightBlur from '../LightBlur';
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      icon: DollarSign,
      title: "Affordable Pricing",
      description: "Get professional documents at a fraction of the cost. No hidden fees, transparent pricing for all document types.",
    },
    {
      icon: Truck,
      title: "Real-time Tracking",
      description: "Track your shipment documents in real-time. Get instant updates on status changes and delivery confirmations.",
    },
    {
      icon: Shield,
      title: "100% Reliable",
      description: "Bank-grade security and 99.9% uptime guarantee. Your documents are safe and always accessible when you need them.",
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Generate professional documents in seconds. No more waiting days for document preparation and processing.",
    }
  ];

  return (
    <SectionPadding className="py-24 relative" id='why-us'>
      {/* Technical Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
      <LightBlur className='right-[-150px] top-1/2 -translate-y-1/2 ' />
      
      <div className="z-1 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-fancy font-black text-white tracking-tighter uppercase italic mb-6 leading-[0.9]">
            Why Choose <span className="text-primary">Sharptoolz?</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            Experience the perfect blend of affordability, speed, and reliability. 
            Designed for high-performance document workflow.
          </p>
        </div>

        {/* Sleek Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
          {features.map((feature, index) => (
            <SpotlightCard 
              key={index} 
              delay={index * 0.1}
            >
               {/* Icon with Sleek Ring */}
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 border border-white/10 text-primary group-hover:text-white group-hover:bg-primary transition-all duration-500">
                     <feature.icon className="w-7 h-7" />
                  </div>
               </div>

               {/* Title */}
               <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter italic">
                 {feature.title}
               </h3>

               {/* Description */}
               <p className="text-sm font-medium leading-relaxed text-white/40 group-hover:text-white/70 transition-colors duration-500">
                 {feature.description}
               </p>

               <div className="mt-auto pt-8 flex items-center justify-between">
                  <div className="h-px flex-1 bg-white/5 group-hover:bg-primary/20 transition-colors" />
                  <div className="ml-4 w-1.5 h-1.5 rounded-full bg-white/5 group-hover:bg-primary transition-all group-hover:animate-pulse" />
               </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </SectionPadding>
  );
}

function SpotlightCard({ 
  children, 
  className = "", 
  delay = 0, 
}: { 
  children: React.ReactNode, 
  className?: string, 
  delay?: number, 
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(350px circle at ${x}px ${y}px, rgba(206, 232, 140, 0.08), transparent 85%)`
  );

  const rotateX = useSpring(useTransform(mouseY, [0, 320], [5, -5]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [0, 240], [-5, 5]), { stiffness: 100, damping: 30 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      onMouseMove={handleMouseMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative rounded-2xl p-8 bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-colors duration-500 overflow-hidden min-h-[320px] flex flex-col",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
        style={{ background }}
      />

      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-12 bg-white/10 group-hover:bg-primary/40 transition-colors duration-500 z-10" />

      <div className="relative z-20 flex flex-col h-full">
         {children}
      </div>

      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}