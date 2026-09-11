const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching profile" });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, password } = req.body;
    const update = {};
    if (name) update.name = name;
    if (password) update.password = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error updating profile" });
  }
});

module.exports = router;
