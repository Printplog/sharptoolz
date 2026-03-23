import { motion } from 'framer-motion';

function RippleRing({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full border border-[#cee88c]/30"
      initial={{ width: 96, height: 96, opacity: 0.4 }}
      animate={{ width: 260, height: 260, opacity: 0 }}
      transition={{ duration: 2, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 2 }}
      style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
    />
  );
}

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#070707]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="relative flex items-center justify-center">
        <RippleRing delay={0} />
        <RippleRing delay={0.7} />

        <motion.img
          src="/logo.png"
          alt="SharpToolz"
          width={80}
          height={80}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [null, 1, 1.02, 1] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 10px #cee88c33)' }}
        />
      </div>

      <motion.span
        className="mt-6 font-black uppercase tracking-[0.3em] text-[10px] text-white/25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        SharpToolz
      </motion.span>
    </motion.div>
  );
}
