import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import { generateAISummary } from "./openai.js"; // Make sure this file exists

// ✅ Load environment variables
dotenv.config();

dotenv.config();

console.log("🔍 GEMINI_API_KEY starts with:", process.env.GEMINI_API_KEY?.slice(0, 8));


const app = express();
app.use(cors());
app.use(express.json());

// ✅ Config
const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI; // must match Spotify dashboard
const FRONTEND_URI = process.env.FRONTEND_URI || "http://localhost:5173/wrapped";

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🎧 Spotify Wrapped AI backend is running!");
});


// ===============================
// 🔹 STEP 1: SPOTIFY LOGIN ROUTE
// ===============================
app.get("/api/login", (req, res) => {
  const scopes = [
    "user-top-read",
    "user-read-recently-played",
    "user-read-private",
  ];

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: scopes.join(" "),
    redirect_uri: REDIRECT_URI,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${queryParams.toString()}`;
  console.log("Redirecting to Spotify login...");
  res.redirect(authUrl);
});


// ==========================================
// 🔹 STEP 2: SPOTIFY CALLBACK (TOKEN EXCHANGE)
// ==========================================
app.get("/api/callback", async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send("No code provided!");

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI, // must match exactly
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenResponse.data;
    console.log("✅ Access token received");

    // ✅ Redirect to frontend with tokens
    const redirectUrl = `${FRONTEND_URI}?access_token=${access_token}&refresh_token=${refresh_token}`;
    console.log("Redirecting user to:", redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Error exchanging Spotify token:", error.response?.data || error.message);
    res.status(400).send("Failed to get Spotify access token");
  }
});


// =======================================
// 🔹 STEP 3: REFRESH TOKEN (optional route)
// =======================================
app.get("/api/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  if (!refresh_token) return res.status(400).send("No refresh token provided!");

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ Error refreshing token:", error.response?.data || error.message);
    res.status(400).send("Failed to refresh access token");
  }
});


// =======================================================
// 🔹 STEP 4: GET USER + TOP TRACKS + AI SUMMARY (NEW)
// =======================================================
app.get("/api/top-tracks", async (req, res) => {
  const access_token = req.query.access_token;
  if (!access_token) return res.status(400).send("Missing access token");

  try {
    // 1️⃣ Get user profile
    const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = profileResponse.data;

    // 2️⃣ Get user's top tracks
    const topTracksResponse = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks?limit=10",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const topTracks = topTracksResponse.data.items.map((track) => ({
      name: track.name,
      artists: track.artists.map((a) => a.name),
      popularity: track.popularity,
    }));

    // 3️⃣ Generate AI summary using OpenAI
    const aiSummary = await generateAISummary({
      displayName: user.display_name,
      topTracks,
    });

    // 4️⃣ Send all data to frontend
    res.json({
      displayName: user.display_name,
      topTracks,
      aiSummary,
    });

  } catch (error) {
    console.error("❌ Error fetching user data or generating AI summary:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to load data" });
  }
});


// =======================================
// 🔹 STEP 5: MONGODB CONNECTION (optional)
// =======================================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// =======================================
// 🔹 START SERVER
// =======================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
