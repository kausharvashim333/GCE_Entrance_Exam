require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const examRoutes = require("./routes/exams");
const questionRoutes = require("./routes/questions");
const resultRoutes = require("./routes/results");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Genius Exam Portal API Running" });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "..")));

// Serve index.html for all non-API routes (SPA fallback)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");

async function startServer() {
  let mongoUri = process.env.MONGODB_URI;
  let mongod = null;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log("MongoDB connected (external)");
        } catch (err) {
      console.error("MongoDB Atlas connection failed:", err.message);
      process.exit(1);
    }
  }

  if (!mongoUri) {
    console.log("Starting local MongoDB with disk persistence...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    
    // Ensure data directory exists
    fs.mkdirSync(DATA_DIR, { recursive: true });
    
    // Check if data directory has data
    const hasData = fs.readdirSync(DATA_DIR).length > 0;
    console.log(`Data directory: ${DATA_DIR} (${hasData ? 'has data' : 'empty'})`);
    
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: DATA_DIR,
        storageEngine: "wiredTiger",
        port: 27017,
      },
      // Use a consistent database name
      binary: {
        version: '7.0.0',
      },
      // Use a fixed instance name to ensure reuse
      instanceName: 'genius-exam-db',
    });
    
    mongoUri = mongod.getUri();
    // Use a fixed database name for persistence
    mongoUri = mongoUri.replace(/\/[^\/]+\?/, '/genius_exam_db?');
    await mongoose.connect(mongoUri);
    console.log("Local MongoDB connected with disk persistence");
  }

  // Graceful shutdown to ensure data is saved
  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const Admin = require("./models/Admin");
  const defaultUsername = (process.env.ADMIN_DEFAULT_USERNAME || "admin").toLowerCase();
  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL?.toLowerCase();
  const existing = await Admin.findOne({
    $or: [
      { email: defaultEmail },
      { username: defaultUsername },
    ],
  });
  if (!existing) {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD, 10);
    await Admin.create({
      name: "Super Admin",
      username: defaultUsername,
      email: defaultEmail,
      password: hash,
      role: "super_admin",
    });
    console.log("Default admin created");
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://0.0.0.0:${PORT}`));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
