const mongoose = require("mongoose");

const habitLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: "Habit", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  status: { type: Boolean, default: false },
  note: { type: String, default: "" },
  completedAt: { type: Date, default: Date.now }
});

// Unique log per habit per day
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HabitLog", habitLogSchema);
