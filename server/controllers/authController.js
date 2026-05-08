const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

exports.adminLogin = async (req, res) => {
  try {
    const { userId, email, password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required" });

    const identifier = (userId || email || "").toLowerCase();
    if (!identifier) return res.status(400).json({ message: "User ID is required" });

    const lookup = identifier.includes("@") ? { email: identifier } : { username: identifier };
    const admin = await Admin.findOne(lookup);
    if (!admin || !admin.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role === "super_admin" ? "admin" : admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, username: admin.username, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const student = await Student.findOne({ studentId });
    if (!student || !student.isActive) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: student._id, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: student._id, name: student.name, studentId: student.studentId, batch: student.batch } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (req.user.role === "student") {
      const student = await Student.findById(req.user.id).select("-password");
      return res.json({ role: "student", user: student });
    }
    const admin = await Admin.findById(req.user.id).select("-password");
    res.json({ role: admin.role, user: admin });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
