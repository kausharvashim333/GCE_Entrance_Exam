const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token, access denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const adminOnly = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token, access denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin" && decoded.role !== "super_admin" && decoded.role !== "moderator") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) return res.status(403).json({ message: "Admin account inactive" });

    req.user = { ...decoded, name: admin.name, email: admin.email };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const studentOnly = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token, access denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Student access required" });
    }

    const student = await Student.findById(decoded.id);
    if (!student || !student.isActive) return res.status(403).json({ message: "Student account inactive" });

    req.user = { ...decoded, name: student.name };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { auth, adminOnly, studentOnly };
