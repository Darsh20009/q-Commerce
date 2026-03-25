import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import logoImg from "@assets/QIROX_LOGO_1774316442270.png";

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 1000); // Allow exit animation to finish
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white"
        >
          {/* Decorative background elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-[20vw] font-black tracking-tighter text-gray-200 select-none">QIROX</span>
          </motion.div>

          <div className="relative flex flex-col items-center">
            {/* Animated Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="w-48 h-48 rounded-full border border-black/5 absolute -top-4"
            />

            {/* Logo Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="relative z-10"
            >
              <img 
                src={logoImg} 
                alt="Qirox Studio Logo" 
                className="h-24 w-auto object-contain"
              />
            </motion.div>

            {/* Slogan Animation */}
            <div className="mt-8 overflow-hidden">
              <motion.p
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                className="text-[10px] font-black uppercase tracking-[0.5em] text-black/40"
              >
                Build Systems. Stay Human.
              </motion.p>
            </div>

            {/* Loading Indicator */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
              className="h-[1px] bg-black mt-12 opacity-20"
            />
          </div>

          {/* Bottom Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="absolute bottom-12"
          >
            <p className="text-[8px] font-bold uppercase tracking-widest text-black/20">
              © 2026 Qirox Studio
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
