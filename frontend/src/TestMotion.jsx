import React from "react";
import { motion } from "framer-motion";

export default function TestMotion() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-white text-3xl font-bold bg-black">
      <h1 className="mb-10 text-cyan-300 drop-shadow-[0_0_10px_#00ffff]">
        Framer Motion Test
      </h1>
      
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(45deg, #00ffff, #ff00ff)",
          boxShadow: "0 0 30px 10px rgba(255, 0, 255, 0.6)",
        }}
      />
    </div>
  );
}
