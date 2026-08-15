import { motion } from "framer-motion";
import { ArrowRight, Code2, FileCheck2, Palette, ShieldCheck } from "lucide-react";
import SectionPadding from "@/layouts/SectionPadding";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function ApiComingSoon() {
  return (
    <section id="api" className="relative scroll-mt-32">
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
            <div className="space-y-7 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-[11px] font-bold text-primary">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(206,232,140,0.8)]" />
                API now available
              </div>

              <h2 className="text-5xl md:text-6xl font-fancy font-semibold text-white tracking-tighter italic leading-[0.9]">
                Build with <span className="text-primary">SharpToolz</span>
              </h2>

              <p className="text-white/40 text-lg font-medium leading-relaxed">
                Add the real SharpToolz hosted form to your product, identify users with your own IDs,
                and generate downloadable documents without rebuilding our editor.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <PremiumButton
                  text="Explore API docs"
                  icon={ArrowRight}
                  href="https://developer.sharptoolz.com"
                  variant="primary"
                />
                <PremiumButton
                  text="Configure API"
                  icon={Palette}
                  href="/settings/api"
                  variant="ghost"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  { icon: ShieldCheck, label: "Scoped API keys" },
                  { icon: Palette, label: "Live form styling" },
                  { icon: FileCheck2, label: "Rendered downloads" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-medium text-white/45">
                    <Icon className="size-4 text-primary/70" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-[#0A0D11]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
                
                <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between relative z-10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3 h-3 text-white/30" />
                    <span className="text-[11px] font-bold text-white/30 leading-none">Hosted integration</span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 space-y-4 relative z-10">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <span className="text-[11px] font-bold text-white/35">Your backend</span>
                      <span className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-bold text-primary">Secure</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-sm">
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">POST</span>
                      <span className="text-white/65">/api/v1/embed-sessions</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/8">
                      <Palette className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Your branded hosted form</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/35">Always uses the current SharpToolz form experience.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <FileCheck2 className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Document ready</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/35">Fetch the result and let your customer download it.</p>
                    </div>
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
    </section>
  );
}
