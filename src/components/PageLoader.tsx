import { motion } from 'framer-motion';

function RippleRing({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full border border-[#cee88c]"
      initial={{ width: 96, height: 96, opacity: 0.5 }}
      animate={{ width: 300, height: 300, opacity: 0 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.6 }}
      style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
    />
  );
}

export default function PageLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#070707]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative flex items-center justify-center">
        <RippleRing delay={0} />
        <RippleRing delay={0.45} />
        <RippleRing delay={0.9} />

        {/* Logo: slams in with spring bounce, then breathes with glow */}
        <motion.div
          initial={{ scale: 0.25, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.img
            src="/logo.png"
            alt="SharpToolz"
            width={96}
            height={96}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 20px #cee88c99)' }}
          />
        </motion.div>
      </div>

      <motion.span
        className="mt-7 font-black uppercase tracking-[0.25em] text-xs text-white/40"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        SharpToolz
      </motion.span>
    </motion.div>
  );
}
