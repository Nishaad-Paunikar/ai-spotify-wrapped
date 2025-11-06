console.log(getComputedStyle(document.body).backgroundColor);


import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Wrapped() {
  const [profile, setProfile] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [displayedText, setDisplayedText] = useState("");

  // 🟢 Fetch Spotify + AI summary
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("access_token");
      if (!token) return;

      try {
        // Fetch Spotify profile
        const profileRes = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

        // Fetch user's top tracks
        const tracksRes = await axios.get(
          "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTopTracks(tracksRes.data.items);

        // Send data to backend for AI summary generation
          const aiRes = await axios.post("https://glycolytically-discerning-layla.ngrok-free.dev/api/summary", {
          displayName: profileRes.data.display_name,
          topTracks: tracksRes.data.items.map((track) => ({
            name: track.name,
            artists: track.artists.map((a) => a.name),
          })),
        });

        setAiSummary(aiRes.data);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // 🧠 Typewriter animation for AI summary text
  useEffect(() => {
    if (aiSummary?.summary) {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + aiSummary.summary[i]);
        i++;
        if (i >= aiSummary.summary.length) clearInterval(interval);
      }, 25);
      return () => clearInterval(interval);
    }
  }, [aiSummary]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden text-white">
      {/* 🌌 Aurora background (from index.css) */}
      <div className="aurora-bg"></div>
      <div className="bg-overlay"></div>


      {/* 🏷️ Title */}
      <h1 className="z-10 text-5xl sm:text-6xl font-extrabold text-center mb-10 bg-gradient-to-r from-green-300 via-yellow-200 to-pink-400 text-transparent bg-clip-text drop-shadow-lg">
        {profile
          ? `${profile.display_name}'s Spotify Wrapped AI`
          : "Spotify Wrapped AI"}
      </h1>

      {/* 🎵 Top Tracks */}
      <div className="z-10 max-w-2xl w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🎶</span> Your Top Tracks
        </h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-200">
          {topTracks.length > 0 ? (
            topTracks.map((track, i) => (
              <li key={i}>
                <strong className="text-white">{track.name}</strong> —{" "}
                {track.artists.map((a) => a.name).join(", ")}
              </li>
            ))
          ) : (
            <p className="italic text-gray-400">Loading your top tracks...</p>
          )}
        </ol>
      </div>

      {/* 🧠 AI Summary */}
      <div className="z-10 bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-lg max-w-2xl w-full">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <span className="mr-2">🧠</span> AI Summary
        </h2>

        {!aiSummary ? (
          <p className="text-gray-200 italic animate-pulse">
            Generating your personalized Wrapped story...
          </p>
        ) : (
          <>
            <p className="text-lg leading-relaxed italic mb-4 text-gray-100">
              {displayedText}
              <span className="animate-pulse text-green-400">|</span>
            </p>
            <h3 className="text-green-300 font-semibold text-xl">
              🎧 {aiSummary.playlist_title}
            </h3>
            <p className="text-gray-300 mt-2 text-sm">{aiSummary.tweet}</p>
          </>
        )}
      </div>
    </div>
  );
}
