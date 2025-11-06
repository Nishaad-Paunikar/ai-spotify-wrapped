import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";

import { generateAISummary } from "./openai.js";
import User from "./models/User.js";

dotenv.config();

import OpenAI from "openai";
dotenv.config();

console.log("🔑 OpenAI API key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


console.log("🔑 OpenAI key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Basic test route
app.get("/", (req, res) => {
  res.send("🎧 Spotify Wrapped AI backend is running!");
});


// ✅ Step 1: Spotify Login Route
app.get("/api/login", (req, res) => {
  const scopes = [
    "user-top-read",
    "user-read-recently-played",
    "user-read-private",
  ];

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: scopes.join(" "),
    redirect_uri: process.env.REDIRECT_URI,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${queryParams.toString()}`;
  res.redirect(authUrl);
});


// ✅ Step 2: Spotify Callback Route
app.get("/api/callback", async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send("No code provided!");

  try {
    // Step 2.1 — Exchange code for access + refresh token
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    console.log("✅ Access token received:", access_token ? "Yes" : "No");
    console.log("✅ Refresh token received:", refresh_token ? "Yes" : "No");

    // Step 2.2 — Fetch user profile
    const profileRes = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;
    console.log("🎧 Logged in as:", profile.display_name);

    // Step 2.3 — Fetch user's top tracks
    const topTracksRes = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=long_term",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const topTracks = topTracksRes.data.items.map((t) => ({
      name: t.name,
      artists: t.artists.map((a) => a.name),
      popularity: t.popularity,
    }));

    console.log(`🎵 Fetched ${topTracks.length} top tracks`);

    // Step 2.4 — Generate AI summary via OpenAI
    const ai = await generateAISummary({
      displayName: profile.display_name,
      topTracks,
    });

    console.log("🤖 AI summary generated successfully");

    // Step 2.5 — Save to MongoDB
    const user = await User.findOneAndUpdate(
      { spotifyId: profile.id },
      {
        spotifyId: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        avatar: profile.images?.[0]?.url,
        refreshToken: refresh_token,
        $push: {
          snapshots: {
            topTracks,
            summary: ai.summary,
            insights: ai.insights,
            playlist_title: ai.playlist_title,
            playlist_caption: ai.playlist_caption,
            tweet: ai.tweet,
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log("✅ User saved/updated:", user.displayName);

    // Step 2.6 — Respond to frontend
    res.json({
      message: "Wrapped AI generated successfully!",
      user: profile.display_name,
      aiSummary: ai,
    });
  } catch (error) {
    console.error("❌ Error in callback:", error.response?.data || error.message);
    res.status(400).json({ error: "Callback failed" });
  }
});


// ✅ Step 3: Refresh Token Route
app.get("/api/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  if (!refresh_token) return res.status(400).send("No refresh token provided!");

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, expires_in } = tokenResponse.data;
    res.json({ access_token, expires_in });
  } catch (error) {
    console.error("❌ Error refreshing token:", error.response?.data || error.message);
    res.status(400).json({ error: "Failed to refresh access token" });
  }
});


// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
