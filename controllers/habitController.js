const Habit = require("../models/Habit");
const HabitLog = require("../models/HabitLog");
const mongoose = require("mongoose");

// Create habit
exports.createHabit = async (req, res) => {
  try {
    const { title, description, frequency, targetDays, color, icon, reminderTime } = req.body;
    const userId = req.user.id;

    const habit = await Habit.create({
      userId,
      title,
      description: description || "",
      frequency: frequency || "daily",
      targetDays: targetDays || [0,1,2,3,4,5,6],
      color: color || "#6C63FF",
      icon: icon || "⭐",
      reminderTime: reminderTime || ""
    });

    res.json(habit);
  } catch (err) {
    res.status(500).json({ msg: "Error creating habit", error: err.message });
  }
};

// Get all habits for user
exports.getHabits = async (req, res) => {
  try {
    const userId = req.user.id;
    const habits = await Habit.find({ userId, isActive: true }).sort({ createdAt: -1 });

    // Get today's logs for all habits
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = await HabitLog.find({ userId, date: today });
    const logMap = {};
    todayLogs.forEach(l => { logMap[l.habitId.toString()] = l.status; });

    const result = habits.map(h => ({
      ...h.toObject(),
      doneToday: logMap[h._id.toString()] || false
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching habits", error: err.message });
  }
};

// Update habit
exports.updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!habit) return res.status(404).json({ msg: "Habit not found" });
    res.json(habit);
  } catch (err) {
    res.status(500).json({ msg: "Error updating habit", error: err.message });
  }
};

// Delete habit (soft delete)
exports.deleteHabit = async (req, res) => {
  try {
    await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isActive: false }
    );
    res.json({ msg: "Habit deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting habit", error: err.message });
  }
};

// Mark habit done/undone
exports.markHabit = async (req, res) => {
  try {
    const { habitId, date, status, note } = req.body;
    const userId = req.user.id;

    let log = await HabitLog.findOne({ habitId, date });

    if (log) {
      log.status = status;
      log.note = note || log.note;
      await log.save();
    } else {
      log = await HabitLog.create({ userId, habitId, date, status, note: note || "" });
    }

    // Recalculate streak
    await updateStreak(habitId, userId);

    res.json(log);
  } catch (err) {
    res.status(500).json({ msg: "Error marking habit", error: err.message });
  }
};

// Update streak helper
async function updateStreak(habitId, userId) {
  const logs = await HabitLog.find({ habitId, status: true }).sort({ date: -1 });
  if (!logs.length) {
    await Habit.findByIdAndUpdate(habitId, { streak: 0 });
    return;
  }

  let streak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date().toISOString().split("T")[0];
  let current = new Date(logs[0].date);

  // Check if today or yesterday is the most recent
  const mostRecent = logs[0].date;
  const diff = Math.floor((new Date(today) - new Date(mostRecent)) / 86400000);
  if (diff > 1) {
    await Habit.findByIdAndUpdate(habitId, { streak: 0 });
    return;
  }

  streak = 1;
  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i-1].date);
    const cur = new Date(logs[i].date);
    const dayDiff = Math.floor((prev - cur) / 86400000);
    if (dayDiff === 1) {
      streak++;
      tempStreak++;
    } else {
      break;
    }
  }

  longestStreak = Math.max(streak, logs.length > 0 ? streak : 0);
  await Habit.findByIdAndUpdate(habitId, { streak, longestStreak });
}

// Get logs for last 30 days for a habit
exports.getHabitLogs = async (req, res) => {
  try {
    const { habitId } = req.params;
    const userId = req.user.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

    const logs = await HabitLog.find({ habitId, userId, date: { $gte: fromDate } }).sort({ date: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching logs", error: err.message });
  }
};

// Analytics
exports.getStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Per-habit completion counts
    const habitStats = await HabitLog.aggregate([
      { $match: { userId, status: true, date: { $gte: fromDate } } },
      {
        $group: {
          _id: "$habitId",
          completed: { $sum: 1 }
        }
      }
    ]);

    // Daily completion counts for last 30 days
    const dailyStats = await HabitLog.aggregate([
      { $match: { userId, date: { $gte: fromDate } } },
      {
        $group: {
          _id: "$date",
          completed: { $sum: { $cond: ["$status", 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Overall totals
    const totalCompleted = await HabitLog.countDocuments({ userId, status: true });
    const totalLogs = await HabitLog.countDocuments({ userId });
    const habits = await Habit.find({ userId, isActive: true });
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
    const longestEver = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);

    res.json({
      habitStats,
      dailyStats,
      totalCompleted,
      totalLogs,
      totalHabits: habits.length,
      maxStreak,
      longestEver
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching stats", error: err.message });
  }
};
