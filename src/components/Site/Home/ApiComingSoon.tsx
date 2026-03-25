import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import SectionPadding from "@/layouts/SectionPadding";

export default function ApiComingSoon() {
  return (
    <div className="relative">
      <SectionPadding className="pb-32 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[48px] p-10 md:p-16 overflow-hidden group shadow-2xl"
        >
          {/* Glass Reflection Effect */}
          <div className="absolute inset-0 bg-linear-to-b from-white/[0.05] to-transparent pointer-events-none" />
          
          {/* Subtle Technical Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
               style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left side: Info */}
            <div className="space-y-6 text-left">
              <h2 className="text-5xl md:text-6xl font-fancy font-black text-white tracking-tighter uppercase italic leading-[0.9]">
                API is <span className="text-primary">Coming Soon</span>
              </h2>

              <p className="text-white/40 text-lg font-medium leading-relaxed">
                We are building a way to connect your apps and business software directly to our tools. 
                Automate document generation effortlessly with our upcoming developer suite.
              </p>
            </div>

            {/* Right side: MacOS Window Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-[#0A0D11]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Window Reflection */}
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
                
                {/* Window Header */}
                <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between relative z-10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-white/20" />
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest leading-none">Status_Preview</span>
                  </div>
                </div>
                
                {/* Code Content */}
                <div className="p-8 font-mono text-sm space-y-4 relative z-10">
                  <div className="flex gap-4">
                     <span className="text-white/10 select-none">01</span>
                     <p className="text-primary/70 italic font-bold">POST /tools/generate</p>
                  </div>
                  <div className="flex gap-4">
                     <span className="text-white/10 select-none">02</span>
                     <p className="text-white/40 leading-relaxed font-medium">
                        {`{`} <br />
                        &nbsp;&nbsp;<span className="text-white/60">"status":</span> <span className="text-primary/50">"building"</span>, <br />
                        &nbsp;&nbsp;<span className="text-white/60">"ready":</span> <span className="text-primary/50">false</span> <br />
                        {`}`}
                     </p>
                  </div>
                </div>
              </div>

              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full -z-10" />
            </motion.div>
          </div>

          {/* Bottom Dock Decor */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
        </motion.div>
      </SectionPadding>
    </div>
  );
}
