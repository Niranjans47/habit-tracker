const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
  targetDays: { type: [Number], default: [0,1,2,3,4,5,6] }, // 0=Sun, 6=Sat
  color: { type: String, default: "#6C63FF" },
  icon: { type: String, default: "⭐" },
  reminderTime: { type: String, default: "" }, // "HH:MM"
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Habit", habitSchema);
