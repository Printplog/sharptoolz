import { motion } from "framer-motion";
import Logo from "@/components/Logo";

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <Logo />

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              repeat: Infinity,
              delay: i * 0.1, // stagger the animation
            }}
          />
        ))}
      </div>
    </div>
  );
}
