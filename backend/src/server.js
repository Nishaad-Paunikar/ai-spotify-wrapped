import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

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

    // Send tokens to frontend (or test directly for now)
    res.json({
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (error) {
    console.error("❌ Error fetching token:", error.response?.data || error.message);
    res.status(400).json({ error: "Failed to retrieve access token" });
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

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
