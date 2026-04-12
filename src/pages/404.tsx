import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import Logo from "@/components/Logo"
import { Home, Hammer, ShieldCheck, Truck, BookOpen } from "lucide-react"

export default function NotFound() {
  const quickLinks = [
    { title: "Dashboard", href: "/dashboard", icon: Home, color: "text-blue-400" },
    { title: "Document Tools", href: "/all-tools", icon: Hammer, color: "text-purple-400" },
    { title: "ID Templates", href: "/tools?category=ID", icon: ShieldCheck, color: "text-green-400" },
    { title: "Logistics", href: "/tools?category=Logistics", icon: Truck, color: "text-amber-400" },
    { title: "Tutorials", href: "/tutorials", icon: BookOpen, color: "text-red-400" },
  ]

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center px-4 text-center overflow-hidden relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] opacity-10" />

      <div className="relative z-10 max-w-2xl w-full">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-12">
            <Logo size={48} />
          </div>

          <motion.div
            className="text-[120px] md:text-[180px] font-black text-white/90 leading-none tracking-tighter italic flex items-center justify-center gap-2"
          >
            4
            <motion.span
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 0.95, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-primary inline-block drop-shadow-[0_0_35px_rgba(var(--primary),0.5)]"
            >
              0
            </motion.span>
            4
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter mt-4">
            Coordinates Not Found
          </h1>
          <p className="text-white/40 mt-4 text-lg font-medium max-w-md mx-auto leading-relaxed">
            The document you're looking for has been archived or relocated. 
            Let's get you back to the right coordinates.
          </p>
        </motion.div>

        {/* Quick Help Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {quickLinks.map((link, idx) => (
            <Link 
              key={idx} 
              to={link.href}
              className="group bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-primary/20 transition-all duration-300 text-left"
            >
              <link.icon className={`w-5 h-5 mb-3 ${link.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{link.title}</span>
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <Link to="/">
            <Button size="lg" className="bg-primary text-black font-black uppercase tracking-[0.2em] px-10 h-14 rounded-full hover:scale-105 transition-all shadow-xl shadow-primary/20">
              Return to Base
            </Button>
          </Link>
        </motion.div>
      </div>

      <footer className="absolute bottom-8 left-0 w-full text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
        © SharpToolz Systems · Operations Center
      </footer>
    </div>
  )
}
