/**
 * Spotify Wrapped AI — Gemini 2.5 Flash Integration
 * Polished, creative, JSON-safe, and playful.
 */

import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const MODEL_ID = "gemini-2.5-flash";

export async function generateAISummary({ displayName, topTracks }) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_ID });

    const trackList = topTracks
      .map((t, i) => `${i + 1}. "${t.name}" by ${t.artists.join(", ")}`)
      .join("\n");

    const prompt = `
You are Spotify Wrapped AI — a bold, witty storyteller that summarizes users’ year in music.
Your tone is playful, emotional, and full of personality — like Spotify’s own Wrapped captions.

Summarize ${displayName}'s top tracks with creativity and flair. 
Mention themes (love, nostalgia, energy, etc.) based on track titles or artists.

Top Tracks:
${trackList}

Respond ONLY in valid JSON (no markdown, no code fences):
{
  "summary": "<3-sentence lively summary>",
  "playlist_title": "<catchy, emotional playlist name>",
  "tweet": "<fun tweet-style caption with emojis>"
}
`;

    console.log(`🎶 Generating summary with ${MODEL_ID}...`);
    const result = await model.generateContent(prompt);
    let text = (await result.response.text()).trim();

    // Clean up possible markdown fences
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Parse JSON safely
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.warn("⚠️ Gemini returned non-JSON output, using fallback summary.");
      parsed = {
        summary: text,
        playlist_title: `Wrapped for ${displayName}`,
        tweet: `🎧 ${displayName}'s Wrapped is live — all the feels in one playlist! 💚`,
      };
    }

    console.log("✅ Gemini AI summary generated successfully!");
    return parsed;
  } catch (error) {
    console.error("❌ Gemini AI generation error:", error.message || error);
    return {
      summary:
        "AI generation failed. Please check your GEMINI_API_KEY or quota and try again later.",
      playlist_title: "Wrapped Reloaded",
      tweet: "⚡ Wrapped data could not be fetched. Try again soon!",
    };
  }
}
