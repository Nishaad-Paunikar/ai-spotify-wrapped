import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ✅ Ensure the correct .env file loads even when run from /src
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("🔑 OpenAI API key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a Spotify Wrapped-style AI summary
 * @param {Object} data - The user data including name + top tracks
 * @returns {Object} summary JSON with keys: summary, insights, playlist_title, playlist_caption, tweet
 */
export async function generateAISummary({ displayName, topTracks }) {
  const formattedTracks = topTracks
    .map(
      (t, i) =>
        `${i + 1}. ${t.name} — ${t.artists.join(", ")} (popularity: ${
          t.popularity
        })`
    )
    .join("\n");

  const prompt = `
You are a friendly AI music analyst. Based on this user's Spotify listening history, 
write a Spotify Wrapped-style summary in JSON format.

Respond ONLY with valid JSON in this structure:
{
  "summary": "short 1-2 sentence summary with emojis",
  "insights": ["4 short bullet points about their taste"],
  "playlist_title": "short creative title (<=5 words)",
  "playlist_caption": "fun short caption (<=20 words)",
  "tweet": "1 tweet (<=140 chars)"
}

User: ${displayName}
Top tracks:
${formattedTracks}
`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 500,
    });

    const text = response.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    else
      return {
        summary: text,
        insights: [],
        playlist_title: "Your Wrapped",
        playlist_caption: "",
        tweet: "",
      };
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return {
      summary: "AI generation failed.",
      insights: [],
      playlist_title: "Your Wrapped",
      playlist_caption: "",
      tweet: "",
    };
  }
}
