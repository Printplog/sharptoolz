// src/pages/NotFound.tsx or src/pages/404.tsx (based on your routing setup)

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import Logo from "@/components/Logo"

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        className="flex items-center gap-2 text-7xl font-extrabold text-primary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        4
        <motion.span
          initial={{ rotate: -15 }}
          animate={{ rotate: [ -15, 15, -15 ] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block text-red-500"
        >
          0
        </motion.span>
        4
      </motion.div>

      <p className="text-muted-foreground mt-4 text-lg">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      <Link to="/" className="mt-6">
        <Button size="lg" variant="default">
          Go back home
        </Button>
      </Link>

      <div className="absolute top-6 left-6">
        <Logo />
      </div>
    </div>
  )
}
