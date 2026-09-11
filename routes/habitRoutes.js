const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  markHabit,
  getHabitLogs,
  getStats
} = require("../controllers/habitController");

router.get("/", auth, getHabits);
router.post("/", auth, createHabit);
router.put("/:id", auth, updateHabit);
router.delete("/:id", auth, deleteHabit);
router.post("/mark", auth, markHabit);
router.get("/logs/:habitId", auth, getHabitLogs);
router.get("/stats", auth, getStats);

module.exports = router;
