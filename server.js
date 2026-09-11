const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/habits", require("./routes/habitRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// Fallback: serve index.html for any non-API route
app.get((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
