import mongoose from "mongoose";

const TrackSchema = new mongoose.Schema({
  trackId: String,
  name: String,
  artists: [String],
  album: String,
  previewUrl: String,
  popularity: Number,
  features: Object,
});

const SnapshotSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  range: { type: String, default: "long_term" },
  topTracks: [TrackSchema],
  topArtists: [{ artistId: String, name: String, genres: [String] }],
  summary: String,
  insights: [String],
  playlist_title: String,
  playlist_caption: String,
  tweet: String,
});

const UserSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  displayName: String,
  email: String,
  avatar: String,
  refreshToken: String,
  snapshots: [SnapshotSchema],
});

// Reuse existing model if already compiled (avoids hot-reload errors)
export default mongoose.models.User || mongoose.model("User", UserSchema);
