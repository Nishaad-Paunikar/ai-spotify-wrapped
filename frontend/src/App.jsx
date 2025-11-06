// src/App.jsx
import React from "react";
import Wrapped from "./pages/Wrapped"; // this imports your full Spotify Wrapped page

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Wrapped />
    </div>
  );
}
