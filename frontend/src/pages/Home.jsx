import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/api/login"; // your backend
  };

  useEffect(() => {
    // hide overflow globally (for safety)
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, #1DB954, #191414, #1DB954, #191414)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 8s ease infinite",
        color: "white",
        textAlign: "center",
        overflow: "hidden",
        margin: 0,
        padding: "0 1rem",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{
          fontSize: "clamp(2rem, 5vw, 4rem)",
          fontWeight: "bold",
          marginBottom: "1rem",
          textShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        Spotify Wrapped AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        style={{
          fontSize: "clamp(1rem, 2vw, 1.3rem)",
          marginBottom: "2rem",
          maxWidth: "600px",
          lineHeight: "1.5",
          color: "#e8e8e8",
        }}
      >
        Discover your year in music — powered by artificial intelligence.
      </motion.p>

      <motion.button
        whileHover={{
          scale: 1.1,
          boxShadow: "0 0 25px #1DB954",
        }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogin}
        style={{
          backgroundColor: "#1DB954",
          border: "none",
          borderRadius: "50px",
          padding: "0.9rem 2.4rem",
          color: "white",
          fontSize: "1.1rem",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "0.3s ease",
        }}
      >
        Log in with Spotify
      </motion.button>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Global CSS reset for no scrollbars */
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
